import { Injectable, computed, signal } from '@angular/core';

import {
  currentVolunteerFixture,
  rescueCasesFixture,
  rescueStatusTransitionsFixture,
  volunteerProfileFixture,
} from '../fixtures/rescue-workflow.fixture.js';
import type {
  RescueBoardFilters,
  RescueCase,
  RescueCaseStatus,
  RescuePhotoUpdate,
  RescueSeverity,
  StatusTransitionOption,
  VolunteerAvailabilityStatus,
  VolunteerProfile,
  VolunteerSummary,
} from '../models/rescue-workflow.model.js';

const defaultFilters: RescueBoardFilters = {
  assignment: 'All',
  query: '',
  severity: 'All',
  species: 'All',
  status: 'All',
};

const completedStatuses: RescueCaseStatus[] = ['REUNITED', 'ADOPTED', 'CLOSED', 'FALSE_REPORT'];

@Injectable({ providedIn: 'root' })
export class RescueWorkflowDataSource {
  readonly rescueCases = signal<RescueCase[]>(rescueCasesFixture);
  readonly volunteerProfile = signal<VolunteerProfile>({ ...volunteerProfileFixture });
  readonly boardFilters = signal<RescueBoardFilters>({ ...defaultFilters });
  readonly toast = signal<string | null>(null);

  readonly currentVolunteer = currentVolunteerFixture;
  readonly transitions = rescueStatusTransitionsFixture;

  readonly assignedCases = computed(() =>
    this.rescueCases().filter((item) => item.assignedVolunteer?.id === this.currentVolunteer.id),
  );
  readonly nearbyUrgentCases = computed(() =>
    this.rescueCases().filter((item) => !item.assignedVolunteer && (item.severity === 'HIGH' || item.severity === 'EMERGENCY')),
  );
  readonly activeCases = computed(() =>
    this.rescueCases().filter((item) => !completedStatuses.includes(item.status)),
  );
  readonly completedCases = computed(() =>
    this.rescueCases().filter((item) => completedStatuses.includes(item.status)),
  );
  readonly filteredCases = computed(() => {
    const filters = this.boardFilters();
    return this.rescueCases().filter((item) => {
      const target = `${item.caseNumber} ${item.animal.nameLabel} ${item.approximateLocation.label} ${item.summary}`.toLowerCase();
      const assignmentMatch =
        filters.assignment === 'All' ||
        (filters.assignment === 'Assigned to me' && item.assignedVolunteer?.id === this.currentVolunteer.id) ||
        (filters.assignment === 'Unassigned' && !item.assignedVolunteer) ||
        (filters.assignment === 'Assigned to others' &&
          !!item.assignedVolunteer &&
          item.assignedVolunteer.id !== this.currentVolunteer.id);
      return (
        target.includes(filters.query.trim().toLowerCase()) &&
        (filters.species === 'All' || item.animal.species === filters.species) &&
        (filters.severity === 'All' || item.severity === filters.severity) &&
        (filters.status === 'All' || item.status === filters.status) &&
        assignmentMatch
      );
    });
  });
  readonly dashboardSummary = computed(() => ({
    active: this.assignedCases().filter((item) => !completedStatuses.includes(item.status)).length,
    completed: this.completedCases().length,
    responseTime: '1h 24m',
    urgent: this.nearbyUrgentCases().length,
  }));

  updateFilter<K extends keyof RescueBoardFilters>(key: K, value: RescueBoardFilters[K]): void {
    this.boardFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearFilters(): void {
    this.boardFilters.set({ ...defaultFilters });
  }

  findCase(id: string | null): RescueCase | undefined {
    return this.rescueCases().find((item) => item.id === id || item.caseNumber === id);
  }

  availableTransitions(status: RescueCaseStatus): StatusTransitionOption[] {
    return this.transitions.filter((item) => item.from === status);
  }

  acceptCase(caseId: string): void {
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              assignedVolunteer: this.currentVolunteer,
              status: item.status === 'NEEDS_RESCUE' ? 'VOLUNTEER_ASSIGNED' : item.status,
              timeline: [
                this.timelineEntry('Volunteer accepted case', 'Current mock volunteer accepted this case.', 'VOLUNTEER_ASSIGNED'),
                ...item.timeline,
              ],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast('Case accepted in mock state.');
  }

  releaseCase(caseId: string): void {
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              assignedVolunteer: undefined,
              timeline: [this.timelineEntry('Assignment released', 'Volunteer released this mock assignment.', item.status), ...item.timeline],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast('Assignment released in mock state.');
  }

  assignVolunteer(caseId: string, volunteer: VolunteerSummary | undefined, actor = 'Admin Mai'): void {
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              assignedVolunteer: volunteer,
              status: volunteer && item.status === 'NEEDS_RESCUE' ? 'VOLUNTEER_ASSIGNED' : item.status,
              timeline: [
                this.timelineEntry(
                  volunteer ? 'Volunteer assigned by admin' : 'Volunteer assignment removed',
                  volunteer ? `${volunteer.name} assigned in frontend mock state.` : 'Admin removed the mock assignment.',
                  volunteer ? 'VOLUNTEER_ASSIGNED' : item.status,
                  true,
                  undefined,
                  actor,
                ),
                ...item.timeline,
              ],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast(volunteer ? `${volunteer.name} assigned in mock state.` : 'Assignment removed in mock state.');
  }

  updateStatus(caseId: string, status: RescueCaseStatus): void {
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              fosterNeeded: status === 'FOSTER_NEEDED' ? true : item.fosterNeeded,
              status,
              timeline: [this.timelineEntry(`Status changed to ${this.statusLabel(status)}`, 'Mock rescue workflow status update.', status), ...item.timeline],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast(`Status changed to ${this.statusLabel(status)}.`);
  }

  addInternalNote(caseId: string, body: string): boolean {
    const trimmed = body.trim();
    if (!trimmed) {
      return false;
    }
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              internalNotes: [
                {
                  author: this.currentVolunteer.name,
                  authorRole: 'Volunteer',
                  body: trimmed,
                  createdAt: 'Just now',
                  id: `note-${Date.now()}`,
                },
                ...item.internalNotes,
              ],
              timeline: [this.timelineEntry('Internal note added', trimmed, item.status, true), ...item.timeline],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast('Internal note added to mock state.');
    return true;
  }

  addPhotoUpdate(caseId: string, photoUrl: string, caption: string): void {
    const update: RescuePhotoUpdate = {
      actor: this.currentVolunteer.name,
      addedAt: 'Just now',
      caption: caption || 'Mock rescue photo update.',
      id: `photo-${Date.now()}`,
      photoUrl,
    };
    this.rescueCases.update((cases) =>
      cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              photoUpdates: [update, ...item.photoUpdates],
              photoUrls: [photoUrl, ...item.photoUrls],
              timeline: [this.timelineEntry('Photo update added', update.caption, item.status, true, photoUrl), ...item.timeline],
              updatedAt: 'Just now',
            }
          : item,
      ),
    );
    this.showToast('Photo update added locally.');
  }

  updateAvailability(status: VolunteerAvailabilityStatus): void {
    this.volunteerProfile.update((profile) => ({
      ...profile,
      availability: { ...profile.availability, status },
    }));
    this.showToast(`Availability changed to ${status}.`);
  }

  updateVolunteerProfile(profile: VolunteerProfile): void {
    this.volunteerProfile.set({ ...profile });
    this.showToast('Volunteer profile saved in mock state.');
  }

  statusLabel(status: RescueCaseStatus): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  severityLabel(severity: RescueSeverity): string {
    return severity.charAt(0) + severity.slice(1).toLowerCase();
  }

  showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => this.toast.set(null), 3000);
  }

  private timelineEntry(
    title: string,
    description: string,
    status?: RescueCaseStatus,
    internal = true,
    photoUrl?: string,
    actor = this.currentVolunteer.name,
  ) {
    return {
      actor,
      description,
      id: `tl-${Date.now()}`,
      internal,
      occurredAt: 'Just now',
      photoUrl,
      status,
      title,
    };
  }
}
