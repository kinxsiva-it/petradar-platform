import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';
import { RescueWorkflowDataSource } from '@petradar/frontend/mock-data';

import { AssignedCaseListComponent } from '../../components/assigned-case-list/assigned-case-list.component.js';
import { VolunteerAvailabilityCardComponent } from '../../components/volunteer-availability-card/volunteer-availability-card.component.js';
import { VolunteerStatCardComponent } from '../../components/volunteer-stat-card/volunteer-stat-card.component.js';

@Component({
  selector: 'pr-volunteer-dashboard-page',
  standalone: true,
  imports: [
    AlertComponent,
    AssignedCaseListComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    RouterLink,
    VolunteerAvailabilityCardComponent,
    VolunteerStatCardComponent,
  ],
  styleUrl: './volunteer-dashboard-page.component.css',
  templateUrl: './volunteer-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerDashboardPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly uiState = signal<'default' | 'loading' | 'empty' | 'error' | 'denied'>(
    (this.route.snapshot.queryParamMap.get('uiState') as 'default' | 'loading' | 'empty' | 'error' | 'denied') ?? 'default',
  );
}
