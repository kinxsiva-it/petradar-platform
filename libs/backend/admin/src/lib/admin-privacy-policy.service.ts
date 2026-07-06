import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';

import { AuditService } from '@petradar/backend/audit';
import type { AuthenticatedUser } from '@petradar/backend/auth';
import {
  LocationPrivacyService,
  maximumPublicRadiusMeters,
  minimumPublicRadiusMeters,
  PrismaService,
  privacyPolicyAuditAction,
  privacyPolicyEntityId,
  privacyPolicyEntityType,
  type EffectivePublicLocationPolicy,
} from '@petradar/backend/shared';

interface RequestContext {
  requestId?: string | null;
}

export interface AdminPrivacyControl {
  description: string;
  key: string;
  supported: boolean;
  value: boolean;
}

export interface AdminModerationOperationalStatus {
  duplicateSightingsCount: number;
  lastModerationActionAt: string | null;
  needsReviewSightingsCount: number;
  pendingSightingsCount: number;
  rejectedSightingsCount: number;
}

export interface AdminPrivacyCenterResponse {
  moderation: AdminModerationOperationalStatus;
  policy: EffectivePublicLocationPolicy;
  supportedControls: AdminPrivacyControl[];
  unsupportedControls: AdminPrivacyControl[];
}

const moderationAuditActions = [
  'SIGHTING_VERIFIED',
  'SIGHTING_REJECTED',
  'SIGHTING_MERGED',
  'ADMIN_SIGHTING_MODERATION_DENIED',
  'ADMIN_SIGHTING_MODERATION_CONFLICT',
];

@Injectable()
export class AdminPrivacyPolicyService {
  constructor(
    private readonly audit: AuditService,
    private readonly locationPrivacy: LocationPrivacyService,
    private readonly prisma: PrismaService,
  ) {}

  async detail(): Promise<AdminPrivacyCenterResponse> {
    const [policy, moderation] = await Promise.all([
      this.locationPrivacy.effectivePublicLocationPolicy(),
      this.moderationStatus(),
    ]);

    return {
      moderation,
      policy,
      supportedControls: supportedControls(policy),
      unsupportedControls: unsupportedControls(),
    };
  }

  async updatePublicLocationPolicy(
    admin: AuthenticatedUser,
    defaultRadiusMeters: number,
    context: RequestContext = {},
  ): Promise<AdminPrivacyCenterResponse> {
    assertSupportedRadius(defaultRadiusMeters);
    const previousPolicy = await this.locationPrivacy.effectivePublicLocationPolicy();
    await this.audit.create({
      action: privacyPolicyAuditAction,
      actorId: admin.id,
      entityId: privacyPolicyEntityId,
      entityType: privacyPolicyEntityType,
      metadata: {
        actorId: admin.id,
        defaultRadiusMeters,
        maximumRadiusMeters: maximumPublicRadiusMeters,
        minimumRadiusMeters: minimumPublicRadiusMeters,
        previousDefaultRadiusMeters: previousPolicy.defaultRadiusMeters,
        unsupportedControlsRemainDisabled: [
          'publicExactLocationExposure',
          'publicReporterContactExposure',
        ],
      },
      requestId: context.requestId,
    });

    return this.detail();
  }

  private async moderationStatus(): Promise<AdminModerationOperationalStatus> {
    const [
      pendingSightingsCount,
      needsReviewSightingsCount,
      rejectedSightingsCount,
      duplicateSightingsCount,
      lastModerationAction,
    ] = await Promise.all([
      this.prisma.animalSighting.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      this.prisma.animalSighting.count({ where: { verificationStatus: VerificationStatus.NEEDS_REVIEW } }),
      this.prisma.animalSighting.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
      this.prisma.animalSighting.count({ where: { verificationStatus: VerificationStatus.DUPLICATE } }),
      this.prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        where: { action: { in: moderationAuditActions } },
      }),
    ]);

    return {
      duplicateSightingsCount,
      lastModerationActionAt: lastModerationAction?.createdAt.toISOString() ?? null,
      needsReviewSightingsCount,
      pendingSightingsCount,
      rejectedSightingsCount,
    };
  }
}

function assertSupportedRadius(defaultRadiusMeters: number): void {
  if (
    !Number.isInteger(defaultRadiusMeters) ||
    defaultRadiusMeters < minimumPublicRadiusMeters ||
    defaultRadiusMeters > maximumPublicRadiusMeters
  ) {
    throw new BadRequestException('Unsupported public-location radius.');
  }
}

function supportedControls(policy: EffectivePublicLocationPolicy): AdminPrivacyControl[] {
  return [
    {
      description: `Public sightings and lost pets use an approximate location radius between ${String(policy.minimumRadiusMeters)} and ${String(policy.maximumRadiusMeters)} meters.`,
      key: 'defaultPublicLocationRadius',
      supported: true,
      value: true,
    },
  ];
}

function unsupportedControls(): AdminPrivacyControl[] {
  return [
    {
      description: 'Exact sighting and rescue coordinates are never exposed to public users.',
      key: 'publicExactLocationExposure',
      supported: false,
      value: false,
    },
    {
      description: 'Reporter phone, email, address, and private identity fields are never exposed publicly.',
      key: 'publicReporterContactExposure',
      supported: false,
      value: false,
    },
  ];
}
