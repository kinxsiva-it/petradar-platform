import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthStateService } from '@petradar/frontend/core';
import {
  RescueCasesApiService,
  toRescueCaseView,
  type RescueCase,
} from '@petradar/frontend/rescue-cases';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AssignedCaseListComponent } from '../../components/assigned-case-list/assigned-case-list.component.js';
import { VolunteerStatCardComponent } from '../../components/volunteer-stat-card/volunteer-stat-card.component.js';

type VolunteerDashboardState = 'default' | 'empty' | 'error' | 'loading';

@Component({
  selector: 'pr-volunteer-dashboard-page',
  standalone: true,
  imports: [
    AlertComponent,
    AssignedCaseListComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    RouterLink,
    VolunteerStatCardComponent,
  ],
  styleUrl: './volunteer-dashboard-page.component.css',
  templateUrl: './volunteer-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerDashboardPageComponent {
  private readonly auth = inject(AuthStateService);
  private readonly rescueCasesApi = inject(RescueCasesApiService);
  readonly uiState = signal<VolunteerDashboardState>('loading');
  readonly errorMessage = signal('');
  readonly cases = signal<RescueCase[]>([]);
  readonly displayName = computed(() => this.auth.user()?.displayName ?? 'Volunteer');
  readonly activeCases = computed(() =>
    this.cases().filter((item) => item.status !== 'RESOLVED' && item.status !== 'CLOSED'),
  );
  readonly completedCases = computed(() =>
    this.cases().filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED'),
  );
  readonly urgentCases = computed(() =>
    this.cases().filter((item) => item.severity === 'HIGH' || item.severity === 'EMERGENCY'),
  );

  constructor() {
    void this.loadAssignedCases();
  }

  async loadAssignedCases(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.rescueCasesApi.list({ pageSize: 50 }));
      this.cases.set(response.items.map(toRescueCaseView));
      this.uiState.set(response.items.length === 0 ? 'empty' : 'default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Assigned rescue cases could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Assigned cases could not be loaded.';
  }
  if (error.status === 403) {
    return 'Volunteer rescue access is not available for this account.';
  }
  return 'Assigned rescue cases could not be loaded.';
}
