export type PrivacyPolicySource = 'audit-log' | 'default' | 'environment';

export interface EffectivePublicLocationPolicy {
  defaultRadiusMeters: number;
  maximumRadiusMeters: number;
  minimumRadiusMeters: number;
  source: PrivacyPolicySource;
  updatedAt: string | null;
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

export interface UpdateAdminPrivacyPolicyRequest {
  defaultRadiusMeters: number;
}
