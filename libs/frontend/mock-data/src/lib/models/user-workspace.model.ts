import type {
  AnimalCondition,
  AnimalSpecies,
  CollarStatus,
  LostPetStatus,
  PublicSighting,
  UrgencyLevel,
  VerificationStatus,
} from './public-discovery.model.js';

export type MockUserRole = 'Pet owner' | 'Trusted reporter';
export type UserReportStatus = 'Draft' | 'Submitted' | 'Needs rescue' | 'Possible match' | 'Closed';
export type MatchLevel = 'Low' | 'Medium' | 'High' | 'Strong';
export type NotificationKind =
  | 'match'
  | 'report-approved'
  | 'report-rejected'
  | 'rescue-status'
  | 'request-info'
  | 'urgent';
export type ContactPreference = 'Email' | 'Phone' | 'In-app message';

export interface CurrentUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  locationLabel: string;
  memberSince: string;
  roles: MockUserRole[];
  trustLabel: string;
  contactPreference: ContactPreference;
  bio: string;
}

export interface UserReport {
  id: string;
  reference: string;
  title: string;
  species: AnimalSpecies;
  animalCount: number;
  condition: AnimalCondition | 'Sick' | 'Pregnant' | 'Aggressive';
  color: string;
  pattern: string;
  collarStatus: CollarStatus;
  description: string;
  photos?: UserReportPhoto[];
  photoUrls: string[];
  approximateLocationLabel: string;
  publicRadiusMeters: number;
  seenAt: string;
  urgency: UrgencyLevel;
  lifecycleStatus: UserReportStatus;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  matchCount: number;
  editable: boolean;
}

export interface UserReportPhoto {
  id: string;
  url: string;
  sortOrder: number;
}

export interface UserLostPet {
  id: string;
  reference: string;
  petName: string;
  species: AnimalSpecies;
  breed: string;
  sex: string;
  ageDescription: string;
  color: string;
  pattern: string;
  collarDescription: string;
  microchipLabel: string;
  description: string;
  photoUrls: string[];
  approximateLastSeenLabel: string;
  lastSeenAt: string;
  contactPreference: ContactPreference;
  contactDetail: string;
  rewardLabel: string;
  hideContactPublicly: boolean;
  status: LostPetStatus;
  possibleMatchCount: number;
}

export interface MatchResult {
  id: string;
  lostPetId: string;
  sightingId: string;
  score: number;
  level: MatchLevel;
  distanceLabel: string;
  seenAt: string;
  approximateLocationLabel: string;
  similarTraits: string[];
  reasons: string[];
  verificationStatus: VerificationStatus;
  reviewRequested: boolean;
}

export interface UserNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAtLabel: string;
  targetLabel: string;
  route: string;
  read: boolean;
}

export interface UserSettings {
  emailNotifications: boolean;
  dailyDigest: boolean;
  smsUrgentAlerts: boolean;
  nearbyUrgentAlerts: boolean;
  showApproximateLocation: boolean;
  showPhoneToVerifiedUsers: boolean;
  allowOwnerContact: boolean;
  allowVolunteerMessages: boolean;
  language: 'English' | 'Thai';
}

export interface ReportAnimalSubmission {
  species: AnimalSpecies;
  animalCount: number;
  condition: UserReport['condition'];
  color: string;
  pattern: string;
  collarStatus: CollarStatus;
  description: string;
  seenDate: string;
  seenTime: string;
  urgency: UrgencyLevel;
  photoUrls: string[];
  approximateLocationLabel: string;
  publicRadiusMeters: number;
}

export interface LostPetSubmission {
  petName: string;
  species: AnimalSpecies;
  breed: string;
  sex: string;
  ageDescription: string;
  color: string;
  pattern: string;
  collarDescription: string;
  microchipLabel: string;
  description: string;
  photoUrls: string[];
  approximateLastSeenLabel: string;
  lastSeenDate: string;
  lastSeenTime: string;
  contactPreference: ContactPreference;
  contactDetail: string;
  rewardLabel: string;
  hideContactPublicly: boolean;
}

export interface MatchDetailView {
  match: MatchResult;
  lostPet: UserLostPet;
  sighting: PublicSighting;
}
