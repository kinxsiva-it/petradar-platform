import type {
  RescueCaseApiResponse,
  RescueCaseStatus,
  RescueInternalNoteApiResponse,
  RescueSeverity,
  RescueSpecies,
  RescueTimelineEventApiResponse,
} from './rescue-cases-api.models.js';

export type RescueAssignmentFilter =
  | 'All'
  | 'Assigned to me'
  | 'Assigned to others'
  | 'Unassigned';

export interface RescueBoardFilters {
  assignment: RescueAssignmentFilter;
  query: string;
  severity: 'All' | RescueSeverity;
  species: 'All' | RescueSpecies;
  status: 'All' | RescueCaseStatus;
}

export interface StatusTransitionOption {
  description: string;
  label: string;
  to: RescueCaseStatus;
}

export interface RescueCase {
  animal: {
    conditionSummary: string;
    nameLabel: string;
    species: string;
  };
  approximateLocation: {
    label: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  assignedVolunteer: { id: string; name: string } | null;
  caseNumber: string;
  closedAt: string | null;
  createdAt: string;
  distanceLabel: string;
  id: string;
  internalNotes: InternalNote[];
  photoUrls: string[];
  reportedAt: string;
  severity: RescueSeverity;
  sightingId: string;
  status: RescueCaseStatus;
  summary: string;
  timeline: RescueTimelineEntry[];
  updatedAt: string;
}

export interface InternalNote {
  author: string;
  body: string;
  createdAt: string;
  id: string;
}

export interface RescueTimelineEntry {
  actor: string;
  description: string;
  id: string;
  internal: boolean;
  occurredAt: string;
  title: string;
}

const placeholderPhotoUrl =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80';

const statusLabels: Record<RescueCaseStatus, string> = {
  ASSIGNED: 'Assigned',
  CLOSED: 'Closed',
  IN_PROGRESS: 'In progress',
  NEEDS_RESCUE: 'Needs rescue',
  NEEDS_VERIFICATION: 'Needs verification',
  NEW_REPORT: 'New report',
  RESOLVED: 'Resolved',
};

const speciesLabels: Record<RescueSpecies, string> = {
  CAT: 'Cat',
  DOG: 'Dog',
  OTHER: 'Other',
};

export function toRescueCaseView(rescueCase: RescueCaseApiResponse): RescueCase {
  const species = speciesLabels[rescueCase.sighting.species];
  return {
    animal: {
      conditionSummary: conditionLabel(rescueCase.sighting.condition),
      nameLabel: `${species} rescue case`,
      species,
    },
    approximateLocation: {
      label: approximateLocationLabel(rescueCase.sighting.publicLocation.radiusMeters),
      latitude: rescueCase.sighting.publicLocation.latitude,
      longitude: rescueCase.sighting.publicLocation.longitude,
      radiusMeters: rescueCase.sighting.publicLocation.radiusMeters,
    },
    assignedVolunteer: rescueCase.assignedVolunteer
      ? {
          id: rescueCase.assignedVolunteer.id,
          name: rescueCase.assignedVolunteer.displayName ?? 'Assigned volunteer',
        }
      : null,
    caseNumber: rescueCase.caseNumber,
    closedAt: rescueCase.closedAt,
    createdAt: rescueCase.createdAt,
    distanceLabel: `${String(rescueCase.sighting.publicLocation.radiusMeters)} m public radius`,
    id: rescueCase.id,
    internalNotes: (rescueCase.internalNotes ?? []).map(toInternalNoteView),
    photoUrls: [placeholderPhotoUrl],
    reportedAt: formatDateTime(rescueCase.createdAt),
    severity: rescueCase.severity,
    sightingId: rescueCase.sighting.id,
    status: rescueCase.status,
    summary: rescueCase.summary,
    timeline: (rescueCase.timeline ?? []).map(toTimelineEntryView),
    updatedAt: rescueCase.updatedAt,
  };
}

export function rescueStatusLabel(status: RescueCaseStatus): string {
  return statusLabels[status];
}

export function rescueSpeciesLabel(species: RescueSpecies): string {
  return speciesLabels[species];
}

export function availableRescueTransitions(status: RescueCaseStatus): StatusTransitionOption[] {
  const transitions: Record<RescueCaseStatus, RescueCaseStatus[]> = {
    ASSIGNED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    CLOSED: [],
    IN_PROGRESS: ['RESOLVED', 'CLOSED'],
    NEEDS_RESCUE: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    NEEDS_VERIFICATION: ['NEEDS_RESCUE', 'CLOSED'],
    NEW_REPORT: ['NEEDS_VERIFICATION', 'NEEDS_RESCUE', 'ASSIGNED', 'CLOSED'],
    RESOLVED: ['CLOSED'],
  };

  return transitions[status].map((next) => ({
    description: `Move this case to ${rescueStatusLabel(next).toLowerCase()}.`,
    label: rescueStatusLabel(next),
    to: next,
  }));
}

function toInternalNoteView(note: RescueInternalNoteApiResponse): InternalNote {
  return {
    author: note.author?.displayName ?? 'PetRadar team',
    body: note.body,
    createdAt: formatDateTime(note.createdAt),
    id: note.id,
  };
}

function toTimelineEntryView(entry: RescueTimelineEventApiResponse): RescueTimelineEntry {
  const previous = entry.previousStatus ? rescueStatusLabel(entry.previousStatus) : null;
  const next = entry.newStatus ? rescueStatusLabel(entry.newStatus) : null;
  return {
    actor: entry.actor?.displayName ?? 'PetRadar system',
    description: entry.note ?? timelineDescription(entry.eventType, previous, next),
    id: entry.id,
    internal: entry.eventType === 'NOTE_ADDED',
    occurredAt: formatDateTime(entry.createdAt),
    title: timelineTitle(entry.eventType),
  };
}

function timelineTitle(eventType: RescueTimelineEventApiResponse['eventType']): string {
  const labels: Record<RescueTimelineEventApiResponse['eventType'], string> = {
    CREATED: 'Case created',
    NOTE_ADDED: 'Internal note added',
    STATUS_CHANGED: 'Status changed',
    VOLUNTEER_ASSIGNED: 'Volunteer assigned',
  };
  return labels[eventType];
}

function timelineDescription(
  eventType: RescueTimelineEventApiResponse['eventType'],
  previous: string | null,
  next: string | null,
): string {
  if (eventType === 'STATUS_CHANGED' && previous && next) {
    return `${previous} to ${next}`;
  }
  return timelineTitle(eventType);
}

function conditionLabel(condition: string): string {
  return condition
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function approximateLocationLabel(radiusMeters: number): string {
  return `Approximate rescue area, ${String(radiusMeters)} m radius`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
