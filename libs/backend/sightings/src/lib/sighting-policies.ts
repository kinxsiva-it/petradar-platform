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
