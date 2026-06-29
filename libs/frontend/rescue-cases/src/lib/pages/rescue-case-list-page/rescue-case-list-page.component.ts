import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';
import {
  AnimalSpecies,
  RescueBoardFilters,
  RescueCaseStatus,
  RescueSeverity,
  RescueWorkflowDataSource,
} from '@petradar/frontend/mock-data';

import { RescueCaseCardComponent } from '../../components/rescue-case-card/rescue-case-card.component.js';

@Component({
  selector: 'pr-rescue-case-list-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RescueCaseCardComponent],
  styleUrl: './rescue-case-list-page.component.css',
  templateUrl: './rescue-case-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueCaseListPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly uiState = signal<'default' | 'loading' | 'empty' | 'error'>(
    (this.route.snapshot.queryParamMap.get('uiState') as 'default' | 'loading' | 'empty' | 'error') ?? 'default',
  );
  readonly speciesOptions: RescueBoardFilters['species'][] = ['All', 'Cat', 'Dog', 'Other'];
  readonly severityOptions: RescueBoardFilters['severity'][] = ['All', 'LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
  readonly statusOptions: RescueBoardFilters['status'][] = [
    'All',
    'NEW_REPORT',
    'NEEDS_VERIFICATION',
    'WATCHING',
    'NEEDS_RESCUE',
    'VOLUNTEER_ASSIGNED',
    'AT_CLINIC',
    'FOSTER_NEEDED',
    'REUNITED',
    'ADOPTED',
    'CLOSED',
  ];
  readonly assignmentOptions: RescueBoardFilters['assignment'][] = ['All', 'Assigned to me', 'Unassigned', 'Assigned to others'];
  readonly groups: { label: string; statuses: RescueCaseStatus[] }[] = [
    { label: 'Needs Rescue', statuses: ['NEW_REPORT', 'NEEDS_VERIFICATION', 'NEEDS_RESCUE'] },
    { label: 'Assigned', statuses: ['VOLUNTEER_ASSIGNED', 'WATCHING'] },
    { label: 'At Clinic', statuses: ['AT_CLINIC'] },
    { label: 'Foster Needed', statuses: ['FOSTER_NEEDED'] },
    { label: 'Completed', statuses: ['REUNITED', 'ADOPTED', 'CLOSED', 'FALSE_REPORT'] },
  ];
  readonly hasFilters = computed(() => {
    const filters = this.rescue.boardFilters();
    return (
      !!filters.query ||
      filters.species !== 'All' ||
      filters.severity !== 'All' ||
      filters.status !== 'All' ||
      filters.assignment !== 'All'
    );
  });

  casesFor(statuses: RescueCaseStatus[]) {
    return this.rescue.filteredCases().filter((item) => statuses.includes(item.status));
  }

  updateFilter<K extends keyof RescueBoardFilters>(key: K, value: RescueBoardFilters[K]): void {
    this.rescue.updateFilter(key, value);
  }
}
