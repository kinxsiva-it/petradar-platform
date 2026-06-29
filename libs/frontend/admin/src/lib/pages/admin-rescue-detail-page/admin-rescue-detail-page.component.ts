import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  AdminWorkspaceDataSource,
  RescueWorkflowDataSource,
  type AdminVolunteerCandidate,
  type RescueCaseStatus,
} from '@petradar/frontend/mock-data';
import {
  InternalNoteListComponent,
  RescueCaseTimelineComponent,
  RescueSeverityBadgeComponent,
  RescueStatusBadgeComponent,
  RescueStatusStepperComponent,
} from '@petradar/frontend/rescue-cases';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import { VolunteerAssignmentPanelComponent } from '../../components/volunteer-assignment-panel/volunteer-assignment-panel.component.js';

@Component({
  selector: 'pr-admin-rescue-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    InternalNoteListComponent,
    LoadingSkeletonComponent,
    PrivacyBannerComponent,
    RescueCaseTimelineComponent,
    RescueSeverityBadgeComponent,
    RescueStatusBadgeComponent,
    RescueStatusStepperComponent,
    RouterLink,
    VolunteerAssignmentPanelComponent,
  ],
  styleUrl: './admin-rescue-detail-page.component.css',
  templateUrl: './admin-rescue-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRescueDetailPageComponent {
  private readonly router = inject(Router);
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly id = this.router.url.split('/').pop()?.split('?')[0] ?? null;
  readonly caseItem = computed(() => this.rescue.findCase(this.id));
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  assign(volunteer: AdminVolunteerCandidate): void {
    const item = this.caseItem();
    if (item) {
      this.rescue.assignVolunteer(item.id, volunteer);
    }
  }

  updateStatus(status: RescueCaseStatus): void {
    const item = this.caseItem();
    if (item) {
      this.rescue.updateStatus(item.id, status);
    }
  }
}
