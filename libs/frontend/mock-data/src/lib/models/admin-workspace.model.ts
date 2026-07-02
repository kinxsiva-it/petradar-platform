import type { RescueCaseStatus, RescueSeverity, VolunteerSummary } from './rescue-workflow.model.js';

export type AdminReportVerificationState = 'PENDING' | 'NEEDS_REVIEW' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE';
export type AdminReportUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type AdminUserRole = 'REPORTER' | 'PET_OWNER' | 'VOLUNTEER' | 'ADMIN';
export type AdminAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export type VolunteerVerificationState = 'NOT_APPLICABLE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AdminActivityType =
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'REPORT_MARKED_DUPLICATE'
  | 'RESCUE_CASE_CREATED'
  | 'VOLUNTEER_ASSIGNED'
  | 'RESCUE_STATUS_UPDATED'
  | 'PRIVACY_SETTING_CHANGED'
  | 'USER_ROLE_CHANGED'
  | 'VOLUNTEER_VERIFIED'
  | 'ACCOUNT_SUSPENDED';

export interface AdminReporterSummary {
  id: string;
  name: string;
  trustScore: number;
  reportCount: number;
  verifiedCount: number;
  avatarUrl: string;
}

export interface AdminLocationView {
  approximateLabel: string;
  internalLabel: string;
  radiusMeters: number;
  accessPolicy: string;
}

export interface AdminReport {
  id: string;
  reference: string;
  species: 'Cat' | 'Dog' | 'Other';
  title: string;
  count: number;
  color: string;
  pattern: string;
  collar: string;
  condition: string;
  description: string;
  seenAt: string;
  submittedAt: string;
  urgency: AdminReportUrgency;
  verification: AdminReportVerificationState;
  lifecycle: 'SIGHTING' | 'POSSIBLE_MATCH' | 'NEEDS_RESCUE' | 'RESOLVED';
  reporter: AdminReporterSummary;
  location: AdminLocationView;
  photoUrls: string[];
  duplicateSuggestionId?: string;
  possibleDuplicateCount: number;
  adminNotes: string[];
  history: AdminActivity[];
}

export interface DuplicateSuggestion {
  id: string;
  primaryReportId: string;
  candidateReportId: string;
  similarityScore: number;
  timeDifference: string;
  approximateDistance: string;
  matchingTraits: string[];
  differingTraits: string[];
  state: 'OPEN' | 'CONFIRMED' | 'KEPT_SEPARATE' | 'REJECTED';
  selectedParentReportId?: string;
}

export interface AdminVolunteerCandidate extends VolunteerSummary {
  availability: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
  verification: 'VERIFIED' | 'PENDING';
  skills: string[];
  coverageArea: string;
  assignedCount: number;
}

export interface PrivacySettings {
  defaultPublicRadiusMeters: number;
  minRadiusMeters: number;
  maxRadiusMeters: number;
  sensitiveLocationProtection: boolean;
  exactLocationRequiresAssignedVolunteer: boolean;
  exactLocationRequiresVerification: boolean;
  rescueCaseExactAccess: 'ADMINS_ONLY' | 'ADMINS_AND_ASSIGNED_VOLUNTEERS';
  lastSavedAt: string;
}

export interface AdminAnalyticsMetric {
  label: string;
  value: string;
  delta: string;
  tone: 'success' | 'warning' | 'danger' | 'match' | 'default';
}

export interface AdminChartSegment {
  label: string;
  value: number;
  color: string;
}

export interface AdminTrendPoint {
  label: string;
  sightings: number;
  rescues: number;
}

export interface AnalyticsSnapshot {
  periodLabel: string;
  metrics: AdminAnalyticsMetric[];
  speciesDistribution: AdminChartSegment[];
  conditionDistribution: AdminChartSegment[];
  rescueStatusDistribution: { status: RescueCaseStatus; count: number; percent: number }[];
  matchDistribution: AdminChartSegment[];
  trend: AdminTrendPoint[];
  textualSummary: string;
}

export interface HeatmapPointAggregate {
  id: string;
  area: string;
  lat: number;
  lng: number;
  densityScore: number;
  reportCount: number;
  injuredCount: number;
  rescueNeedCount: number;
  speciesDistribution: AdminChartSegment[];
  conditionDistribution: AdminChartSegment[];
  recentTrend: string;
  suggestedAction: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

export interface ExecutiveReportSnapshot {
  period: string;
  title: string;
  summary: string;
  metrics: AdminAnalyticsMetric[];
  keyHotspots: { area: string; reportCount: number; severity: HeatmapPointAggregate['severity'] }[];
  volunteerSummary: string;
  resolutionSummary: string;
  matchingSummary: string;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  roles: AdminUserRole[];
  accountStatus: AdminAccountStatus;
  volunteerVerification: VolunteerVerificationState;
  joinedAt: string;
  lastActivity: string;
  reportCount: number;
  lostPetCount: number;
  rescueParticipationCount: number;
  trustSummary: string;
  locationLabel: string;
}

export interface AdminActivity {
  id: string;
  type: AdminActivityType;
  actor: string;
  entity: string;
  occurredAt: string;
  summary: string;
  reason?: string;
  sensitive: boolean;
}

export interface AdminWorkspaceFilters {
  query: string;
  species: 'All' | AdminReport['species'];
  urgency: 'All' | AdminReportUrgency;
  verification: 'All' | AdminReportVerificationState;
  condition: string;
  reporter: string;
}

export interface AdminRescueFilters {
  query: string;
  severity: 'All' | RescueSeverity;
  status: 'All' | RescueCaseStatus;
  assignment: 'All' | 'Assigned' | 'Unassigned';
  volunteerId: string;
}

export interface AdminUserFilters {
  query: string;
  role: 'All' | AdminUserRole;
  accountStatus: 'All' | AdminAccountStatus;
  volunteerVerification: 'All' | VolunteerVerificationState;
}
