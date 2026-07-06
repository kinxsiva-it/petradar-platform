import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import {
  createAngularTable,
  createColumnHelper,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/angular-table';
import { lastValueFrom } from 'rxjs';

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
import type {
  ListRescueCasesFilters,
  RescueCaseStatus,
} from '../../data-access/rescue-cases-api.models.js';
import { RescueCasesApiService } from '../../data-access/rescue-cases-api.service.js';

type RescueBoardState = 'default' | 'empty' | 'error' | 'loading';

const defaultFilters: RescueBoardFilters = {
  assignment: 'All',
  query: '',
  severity: 'All',
  species: 'All',
  status: 'All',
};

const rescueCaseColumnHelper = createColumnHelper<RescueCase>();
const rescueCaseColumns: ColumnDef<RescueCase, string>[] = [
  rescueCaseColumnHelper.accessor('caseNumber', {
    header: 'Case',
  }),
  rescueCaseColumnHelper.accessor((caseItem) => caseItem.animal.nameLabel, {
    header: 'Animal',
    id: 'animal',
  }),
  rescueCaseColumnHelper.accessor(rescueCaseSeverityValue, {
    header: 'Severity',
    id: 'severity',
  }),
  rescueCaseColumnHelper.accessor((caseItem) => rescueStatusLabel(caseItem.status), {
    header: 'Status',
    id: 'status',
  }),
  rescueCaseColumnHelper.accessor((caseItem) => caseItem.assignedVolunteer?.name ?? 'Unassigned', {
    header: 'Assignment',
    id: 'assignment',
  }),
];
const rescueCaseRowModel = getCoreRowModel<RescueCase>();

function rescueCaseSeverityValue(caseItem: RescueCase): string {
  return caseItem.severity;
}

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
  readonly filters = signal<RescueBoardFilters>({ ...defaultFilters });
  private readonly serverFilters = computed<ListRescueCasesFilters>(() => {
    const filters = this.filters();
    return {
      pageSize: 50,
      severity: filters.severity === 'All' ? undefined : filters.severity,
      species: filters.species === 'All' ? undefined : filters.species,
      status: filters.status === 'All' ? undefined : filters.status,
    };
  });
  readonly rescueCasesQuery = injectQuery(() => ({
    queryFn: () => lastValueFrom(this.rescueCasesApi.list(this.serverFilters())),
    queryKey: ['rescue-cases', 'list', this.serverFilters()],
    staleTime: 30_000,
  }));
  readonly cases = computed<RescueCase[]>(() =>
    (this.rescueCasesQuery.data()?.items ?? []).map(toRescueCaseView),
  );
  readonly uiState = computed<RescueBoardState>(() => {
    if (this.rescueCasesQuery.isPending()) {
      return 'loading';
    }
    if (this.rescueCasesQuery.isError()) {
      return 'error';
    }
    return this.cases().length === 0 ? 'empty' : 'default';
  });
  readonly errorMessage = computed(() => toUserMessage(this.rescueCasesQuery.error()));
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
  readonly table = createAngularTable<RescueCase>(() => ({
    columns: rescueCaseColumns,
    data: this.filteredCases(),
    getCoreRowModel: rescueCaseRowModel,
  }));
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

  casesFor(statuses: readonly RescueCaseStatus[]): RescueCase[] {
    return this.table
      .getRowModel()
      .rows.map((row) => row.original)
      .filter((item) => statuses.includes(item.status));
  }

  updateFilter<K extends keyof RescueBoardFilters>(key: K, value: RescueBoardFilters[K]): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearFilters(): void {
    this.filters.set({ ...defaultFilters });
  }

  statusLabel(status: RescueBoardFilters['status']): string {
    return status === 'All' ? 'All' : rescueStatusLabel(status);
  }

  speciesLabel(species: RescueBoardFilters['species']): string {
    return species === 'All' ? 'All' : rescueSpeciesLabel(species);
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
