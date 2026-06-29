import type { AnimalSpecies } from './public-discovery.model.js';

export type RescueCaseStatus =
  | 'NEW_REPORT'
  | 'NEEDS_VERIFICATION'
  | 'WATCHING'
  | 'NEEDS_RESCUE'
  | 'VOLUNTEER_ASSIGNED'
  | 'AT_CLINIC'
  | 'FOSTER_NEEDED'
  | 'REUNITED'
  | 'ADOPTED'
  | 'CLOSED'
  | 'FALSE_REPORT';

export type RescueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type VolunteerAvailabilityStatus = 'Available' | 'Busy' | 'Off duty';

export interface RescueAnimalSummary {
  species: AnimalSpecies;
  nameLabel: string;
  conditionSummary: string;
  color: string;
  pattern: string;
}

export interface RescueLocationSummary {
  label: string;
  area: string;
  radiusMeters: number;
  latitude?: number;
  longitude?: number;
}

export interface VolunteerSummary {
  id: string;
  name: string;
  avatarUrl: string;
  roleLabel: string;
  verified: boolean;
  phone: string;
  email: string;
}

export interface ClinicSummary {
  name: string;
  area: string;
  phone: string;
}

export interface RescueTimelineEntry {
  id: string;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
  status?: RescueCaseStatus;
  internal: boolean;
  photoUrl?: string;
}

export interface InternalNote {
  id: string;
  author: string;
  authorRole: 'Volunteer' | 'Admin';
  createdAt: string;
  body: string;
}

export interface RescuePhotoUpdate {
  id: string;
  photoUrl: string;
  caption: string;
  addedAt: string;
  actor: string;
}

export interface RescueCase {
  id: string;
  caseNumber: string;
  animal: RescueAnimalSummary;
  severity: RescueSeverity;
  status: RescueCaseStatus;
  approximateLocation: RescueLocationSummary;
  internalAuthorizedLocation?: RescueLocationSummary;
  reportedAt: string;
  updatedAt: string;
  assignedVolunteer?: VolunteerSummary;
  summary: string;
  photoUrls: string[];
  timeline: RescueTimelineEntry[];
  internalNotes: InternalNote[];
  photoUpdates: RescuePhotoUpdate[];
  clinic?: ClinicSummary;
  fosterNeeded: boolean;
  distanceLabel: string;
}

export interface VolunteerAvailability {
  status: VolunteerAvailabilityStatus;
  areaLabel: string;
  radiusKm: number;
  weekdays: string;
  weekend: string;
  preferredSpecies: AnimalSpecies[];
}

export interface VolunteerProfile {
  volunteer: VolunteerSummary;
  joinedAt: string;
  coverageArea: string;
  skills: string[];
  preferredAnimalTypes: AnimalSpecies[];
  casesAssisted: number;
  completedCases: number;
  ratingLabel: string;
  bio: string;
  availability: VolunteerAvailability;
}

export interface StatusTransitionOption {
  from: RescueCaseStatus;
  to: RescueCaseStatus;
  label: string;
  description: string;
}

export interface RescueBoardFilters {
  query: string;
  species: 'All' | AnimalSpecies;
  severity: 'All' | RescueSeverity;
  status: 'All' | RescueCaseStatus;
  assignment: 'All' | 'Assigned to me' | 'Unassigned' | 'Assigned to others';
}
