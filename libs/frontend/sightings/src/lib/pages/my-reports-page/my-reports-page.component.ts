import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';
import { AnimalSpecies, UserReport, UserWorkspaceDataSource, VerificationStatus } from '@petradar/frontend/mock-data';

import { MyReportCardComponent } from '../../components/my-report-card/my-report-card.component.js';
import { ReportEditDrawerComponent } from '../../components/report-edit-drawer/report-edit-drawer.component.js';

type ReportStatusFilter = 'All' | 'Draft' | 'Submitted' | 'Needs rescue' | 'Possible match' | 'Closed';

@Component({
  selector: 'pr-my-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    MyReportCardComponent,
    ReportEditDrawerComponent,
    RouterLink,
  ],
  styleUrl: './my-reports-page.component.css',
  templateUrl: './my-reports-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReportsPageComponent {
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly editingReport = signal<UserReport | null>(null);
  readonly uiState = signal<'default' | 'loading' | 'error'>('default');
  readonly statusOptions: ReportStatusFilter[] = ['All', 'Submitted', 'Needs rescue', 'Possible match', 'Closed'];
  readonly verificationOptions: ('All' | VerificationStatus)[] = ['All', 'Pending', 'Verified', 'Needs review'];
  readonly speciesOptions: ('All' | AnimalSpecies)[] = ['All', 'Cat', 'Dog', 'Other'];

  query = '';
  status: ReportStatusFilter = 'All';
  verification: 'All' | VerificationStatus = 'All';
  species: 'All' | AnimalSpecies = 'All';

  readonly filteredReports = computed(() =>
    this.workspace.userReports().filter((report) => {
      const query = `${report.reference} ${report.title} ${report.approximateLocationLabel}`.toLowerCase();
      return (
        query.includes(this.query.trim().toLowerCase()) &&
        (this.status === 'All' || report.lifecycleStatus === this.status) &&
        (this.verification === 'All' || report.verificationStatus === this.verification) &&
        (this.species === 'All' || report.species === this.species)
      );
    }),
  );

  clearFilters(): void {
    this.query = '';
    this.status = 'All';
    this.verification = 'All';
    this.species = 'All';
  }

  saveMockEdit(id: string): void {
    this.workspace.showToast(`Mock edit saved for ${id}.`);
    this.editingReport.set(null);
  }
}
