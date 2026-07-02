export type RescueCaseStatus =
  | 'ASSIGNED'
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'NEEDS_RESCUE'
  | 'NEEDS_VERIFICATION'
  | 'NEW_REPORT'
  | 'RESOLVED';

export type RescueSeverity = 'EMERGENCY' | 'HIGH' | 'LOW' | 'MEDIUM';

export type RescueTimelineEventType =
  | 'CREATED'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED'
  | 'VOLUNTEER_ASSIGNED';

export type RescueSpecies = 'CAT' | 'DOG' | 'OTHER';

export interface RescueCaseActorApiResponse {
  displayName: string | null;
  id: string;
}

export interface RescueCaseApiResponse {
  assignedVolunteer: RescueCaseActorApiResponse | null;
  caseNumber: string;
  closedAt: string | null;
  createdAt: string;
  createdById: string | null;
  id: string;
  internalNotes?: RescueInternalNoteApiResponse[];
  severity: RescueSeverity;
  sighting: {
    condition: string;
    id: string;
    publicLocation: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
    };
    species: RescueSpecies;
  };
  status: RescueCaseStatus;
  summary: string;
  timeline?: RescueTimelineEventApiResponse[];
  updatedAt: string;
}

export interface RescueInternalNoteApiResponse {
  author: RescueCaseActorApiResponse | null;
  body: string;
  createdAt: string;
  id: string;
}

export interface RescueTimelineEventApiResponse {
  actor: RescueCaseActorApiResponse | null;
  createdAt: string;
  eventType: RescueTimelineEventType;
  id: string;
  newStatus: RescueCaseStatus | null;
  note: string | null;
  previousStatus: RescueCaseStatus | null;
}

export interface PaginatedRescueCasesApiResponse {
  items: RescueCaseApiResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListRescueCasesFilters {
  assignedVolunteerId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
  severity?: RescueSeverity;
  species?: RescueSpecies;
  status?: RescueCaseStatus;
}

export interface CreateRescueCaseRequest {
  assignedVolunteerId?: string;
  severity: RescueSeverity;
  sightingId: string;
  status?: RescueCaseStatus;
  summary: string;
}

export interface UpdateRescueStatusRequest {
  note?: string;
  status: RescueCaseStatus;
}

export interface AssignVolunteerRequest {
  volunteerId: string;
}

export interface CreateInternalNoteRequest {
  body: string;
}
