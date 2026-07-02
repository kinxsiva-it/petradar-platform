import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthStateService } from '@petradar/frontend/core';
import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { RescueCaseCardComponent } from '../../components/rescue-case-card/rescue-case-card.component.js';
import {
  rescueSpeciesLabel,
  rescueStatusLabel,
  toRescueCaseView,
  type RescueBoardFilters,
  type RescueCase,
} from '../../data-access/rescue-case-ui.mapper.js';
import type { RescueCaseStatus } from '../../data-access/rescue-cases-api.models.js';
import { RescueCasesApiService } from '../../data-access/rescue-cases-api.service.js';

type RescueBoardState = 'default' | 'empty' | 'error' | 'loading';

const defaultFilters: RescueBoardFilters = {
  assignment: 'All',
  query: '',
  severity: 'All',
  species: 'All',
  status: 'All',
};

@Component({
  selector: 'pr-rescue-case-list-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RescueCaseCardComponent],
  styleUrl: './rescue-case-list-page.component.css',
  templateUrl: './rescue-case-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueCaseListPageComponent {
  private readonly auth = inject(AuthStateService);
  private readonly rescueCasesApi = inject(RescueCasesApiService);
  private readonly router = inject(Router);
  readonly uiState = signal<RescueBoardState>('loading');
  readonly errorMessage = signal('');
  readonly cases = signal<RescueCase[]>([]);
  readonly filters = signal<RescueBoardFilters>({ ...defaultFilters });
  readonly speciesOptions: RescueBoardFilters['species'][] = ['All', 'CAT', 'DOG', 'OTHER'];
  readonly severityOptions: RescueBoardFilters['severity'][] = [
    'All',
    'LOW',
    'MEDIUM',
    'HIGH',
    'EMERGENCY',
  ];
  readonly statusOptions: RescueBoardFilters['status'][] = [
    'All',
    'NEW_REPORT',
    'NEEDS_VERIFICATION',
    'NEEDS_RESCUE',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];
  readonly assignmentOptions: RescueBoardFilters['assignment'][] = [
    'All',
    'Assigned to me',
    'Unassigned',
    'Assigned to others',
  ];
  readonly groups: { label: string; statuses: RescueCaseStatus[] }[] = [
    { label: 'Needs Rescue', statuses: ['NEW_REPORT', 'NEEDS_VERIFICATION', 'NEEDS_RESCUE'] },
    { label: 'Assigned', statuses: ['ASSIGNED'] },
    { label: 'In Progress', statuses: ['IN_PROGRESS'] },
    { label: 'Completed', statuses: ['RESOLVED', 'CLOSED'] },
  ];
  readonly activeCases = computed(() =>
    this.cases().filter((item) => item.status !== 'RESOLVED' && item.status !== 'CLOSED'),
  );
  readonly assignedToMe = computed(() =>
    this.cases().filter((item) => item.assignedVolunteer?.id === this.auth.user()?.id),
  );
  readonly urgentCases = computed(() =>
    this.cases().filter((item) => item.severity === 'HIGH' || item.severity === 'EMERGENCY'),
  );
  readonly completedCases = computed(() =>
    this.cases().filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED'),
  );
  readonly filteredCases = computed(() => this.applyClientFilters(this.cases()));
  readonly hasFilters = computed(() => {
    const filters = this.filters();
    return (
      filters.query.trim().length > 0 ||
      filters.species !== 'All' ||
      filters.severity !== 'All' ||
      filters.status !== 'All' ||
      filters.assignment !== 'All'
    );
  });
  readonly detailBaseRoute = computed(() =>
    this.router.url.startsWith('/volunteer/') ? '/volunteer/rescue-cases' : '/rescue-cases',
  );

  constructor() {
    void this.loadCases();
  }

  casesFor(statuses: readonly RescueCaseStatus[]): RescueCase[] {
    return this.filteredCases().filter((item) => statuses.includes(item.status));
  }

  updateFilter<K extends keyof RescueBoardFilters>(key: K, value: RescueBoardFilters[K]): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
    if (key === 'severity' || key === 'species' || key === 'status') {
      void this.loadCases();
    }
  }

  clearFilters(): void {
    this.filters.set({ ...defaultFilters });
    void this.loadCases();
  }

  statusLabel(status: RescueBoardFilters['status']): string {
    return status === 'All' ? 'All' : rescueStatusLabel(status);
  }

  speciesLabel(species: RescueBoardFilters['species']): string {
    return species === 'All' ? 'All' : rescueSpeciesLabel(species);
  }

  private async loadCases(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const filters = this.filters();
      const response = await firstValueFrom(
        this.rescueCasesApi.list({
          pageSize: 50,
          severity: filters.severity === 'All' ? undefined : filters.severity,
          species: filters.species === 'All' ? undefined : filters.species,
          status: filters.status === 'All' ? undefined : filters.status,
        }),
      );
      this.cases.set(response.items.map(toRescueCaseView));
      this.uiState.set(response.items.length === 0 ? 'empty' : 'default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  private applyClientFilters(cases: readonly RescueCase[]): RescueCase[] {
    const filters = this.filters();
    const query = filters.query.trim().toLowerCase();
    const currentUserId = this.auth.user()?.id;
    return cases.filter((item) => {
      const searchable =
        `${item.caseNumber} ${item.animal.nameLabel} ${item.summary} ${item.approximateLocation.label}`.toLowerCase();
      const assignmentMatches =
        filters.assignment === 'All' ||
        (filters.assignment === 'Assigned to me' && item.assignedVolunteer?.id === currentUserId) ||
        (filters.assignment === 'Assigned to others' &&
          !!item.assignedVolunteer &&
          item.assignedVolunteer.id !== currentUserId) ||
        (filters.assignment === 'Unassigned' && !item.assignedVolunteer);
      return (!query || searchable.includes(query)) && assignmentMatches;
    });
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Rescue cases could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Rescue cases could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to view rescue cases.';
  }
  return 'Rescue cases could not be loaded.';
}
