import { SightingLifecycleStatus, VerificationStatus } from '@prisma/client';

export interface SightingStatusPolicyInput {
  lifecycleStatus: SightingLifecycleStatus;
  verificationStatus: VerificationStatus;
}

export function isPubliclyVisibleSighting(input: SightingStatusPolicyInput): boolean {
  return (
    input.verificationStatus !== VerificationStatus.REJECTED &&
    input.verificationStatus !== VerificationStatus.DUPLICATE
  );
}

export function isOwnerEditableSighting(input: SightingStatusPolicyInput): boolean {
  if (
    input.verificationStatus === VerificationStatus.VERIFIED ||
    input.verificationStatus === VerificationStatus.COMMUNITY_VERIFIED ||
    input.verificationStatus === VerificationStatus.REJECTED ||
    input.verificationStatus === VerificationStatus.DUPLICATE
  ) {
    return false;
  }

  return (
    input.lifecycleStatus !== SightingLifecycleStatus.NEEDS_RESCUE &&
    input.lifecycleStatus !== SightingLifecycleStatus.REUNITED &&
    input.lifecycleStatus !== SightingLifecycleStatus.CLOSED
  );
}

export type ModerationAction = 'verify' | 'reject';

export interface SightingModerationPolicyResult {
  allowed: boolean;
  reason?: string;
}

export function canModerateSighting(
  input: SightingStatusPolicyInput,
  action: ModerationAction,
): SightingModerationPolicyResult {
  if (input.lifecycleStatus !== SightingLifecycleStatus.SIGHTING) {
    return {
      allowed: false,
      reason: `Sightings with lifecycle status ${input.lifecycleStatus} cannot be moderated.`,
    };
  }

  if (
    input.verificationStatus === VerificationStatus.PENDING ||
    input.verificationStatus === VerificationStatus.NEEDS_REVIEW
  ) {
    return { allowed: true };
  }

  if (
    input.verificationStatus === VerificationStatus.VERIFIED ||
    input.verificationStatus === VerificationStatus.COMMUNITY_VERIFIED
  ) {
    return {
      allowed: false,
      reason:
        action === 'verify'
          ? 'This sighting is already verified.'
          : 'A verified sighting cannot be rejected without a reopen workflow.',
    };
  }

  if (input.verificationStatus === VerificationStatus.REJECTED) {
    return {
      allowed: false,
      reason:
        action === 'reject'
          ? 'This sighting is already rejected.'
          : 'A rejected sighting cannot be verified without a reopen workflow.',
    };
  }

  return {
    allowed: false,
    reason: 'Duplicate sightings cannot be moderated through this action.',
  };
}
