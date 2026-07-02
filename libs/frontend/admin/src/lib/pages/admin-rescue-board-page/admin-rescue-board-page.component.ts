import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AdminWorkspaceDataSource,
  RescueWorkflowDataSource,
  type AdminVolunteerCandidate,
  type RescueCase,
  type RescueCaseStatus,
} from '@petradar/frontend/mock-data';
import { RescueCaseCardComponent } from '@petradar/frontend/rescue-cases';
import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { VolunteerAssignmentPanelComponent } from '../../components/volunteer-assignment-panel/volunteer-assignment-panel.component.js';

@Component({
  selector: 'pr-admin-rescue-board-page',
  standalone: true,
  imports: [
    AdminSummaryCardComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    RescueCaseCardComponent,
    RouterLink,
    VolunteerAssignmentPanelComponent,
  ],
  styleUrl: './admin-rescue-board-page.component.css',
  templateUrl: './admin-rescue-board-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRescueBoardPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly selectedCase = signal<RescueCase | undefined>(undefined);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');
  readonly groups: Array<{ label: string; statuses: RescueCaseStatus[] }> = [
    { label: 'Needs Verification', statuses: ['NEEDS_VERIFICATION', 'WATCHING'] },
    { label: 'Needs Rescue', statuses: ['NEEDS_RESCUE'] },
    { label: 'Assigned', statuses: ['VOLUNTEER_ASSIGNED'] },
    { label: 'At Clinic', statuses: ['AT_CLINIC'] },
    { label: 'Foster Needed', statuses: ['FOSTER_NEEDED'] },
    { label: 'Completed', statuses: ['REUNITED', 'ADOPTED', 'CLOSED'] },
  ];
  readonly filteredCases = computed(() => {
    const filters = this.admin.rescueFilters();
    return this.rescue.rescueCases().filter((item) => {
      const target = `${item.caseNumber} ${item.animal.nameLabel} ${item.summary} ${item.approximateLocation.label}`.toLowerCase();
      return (
        target.includes(filters.query.trim().toLowerCase()) &&
        (filters.severity === 'All' || item.severity === filters.severity) &&
        (filters.status === 'All' || item.status === filters.status) &&
        (filters.assignment === 'All' || (filters.assignment === 'Assigned' ? !!item.assignedVolunteer : !item.assignedVolunteer)) &&
        (filters.volunteerId === 'All' || item.assignedVolunteer?.id === filters.volunteerId)
      );
    });
  });

  casesFor(statuses: RescueCaseStatus[]): RescueCase[] {
    return this.filteredCases().filter((item) => statuses.includes(item.status));
  }

  assign(volunteer: AdminVolunteerCandidate): void {
    const item = this.selectedCase();
    if (!item) {
      return;
    }
    this.rescue.assignVolunteer(item.id, volunteer);
    this.selectedCase.set(this.rescue.findCase(item.id));
  }

  removeAssignment(): void {
    const item = this.selectedCase();
    if (item) {
      this.rescue.assignVolunteer(item.id, undefined);
      this.selectedCase.set(this.rescue.findCase(item.id));
    }
  }
}
