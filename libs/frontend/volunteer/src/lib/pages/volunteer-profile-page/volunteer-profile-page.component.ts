import { DatePipe } from '@angular/common';
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
import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

import { VolunteerStatCardComponent } from '../../components/volunteer-stat-card/volunteer-stat-card.component.js';

type VolunteerProfileState = 'default' | 'empty' | 'error' | 'loading';

@Component({
  selector: 'pr-volunteer-profile-page',
  standalone: true,
  imports: [
    AlertComponent,
    DatePipe,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    RouterLink,
    StatusBadgeComponent,
    VolunteerStatCardComponent,
  ],
  styleUrl: './volunteer-profile-page.component.css',
  templateUrl: './volunteer-profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerProfilePageComponent {
  readonly auth = inject(AuthStateService);
  private readonly rescueCasesApi = inject(RescueCasesApiService);
  readonly uiState = signal<VolunteerProfileState>('loading');
  readonly errorMessage = signal('');
  readonly cases = signal<RescueCase[]>([]);
  readonly user = computed(() => this.auth.user());
  readonly initials = computed(() => initialsFor(this.user()?.displayName));
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

function initialsFor(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return 'PR';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Volunteer profile activity could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Volunteer profile activity could not be loaded.';
  }
  if (error.status === 403) {
    return 'Volunteer rescue access is not available for this account.';
  }
  return 'Volunteer profile activity could not be loaded.';
}
