import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { MyReportCardComponent } from '../../components/my-report-card/my-report-card.component.js';
import { ReportEditDrawerComponent } from '../../components/report-edit-drawer/report-edit-drawer.component.js';
import {
  SightingsApiService,
  toUpdateSightingRequest,
  toUserReportView,
  type AnimalSpecies,
  type UserReport,
  type VerificationStatus,
} from '../../data-access/index.js';
import type { UpdateSightingRequest } from '../../data-access/sightings-api.models.js';

type ReportStatusFilter =
  | 'All'
  | 'Draft'
  | 'Submitted'
  | 'Needs rescue'
  | 'Possible match'
  | 'Closed';

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
  private readonly sightingsApi = inject(SightingsApiService);
  readonly editingReport = signal<UserReport | null>(null);
  readonly reports = signal<UserReport[]>([]);
  readonly uiState = signal<'default' | 'loading' | 'error'>('loading');
  readonly errorMessage = signal('');
  readonly statusOptions: ReportStatusFilter[] = [
    'All',
    'Submitted',
    'Needs rescue',
    'Possible match',
    'Closed',
  ];
  readonly verificationOptions: ('All' | VerificationStatus)[] = [
    'All',
    'Pending',
    'Verified',
    'Needs review',
    'Rejected',
  ];
  readonly speciesOptions: ('All' | AnimalSpecies)[] = ['All', 'Cat', 'Dog', 'Other'];

  query = '';
  status: ReportStatusFilter = 'All';
  verification: 'All' | VerificationStatus = 'All';
  species: 'All' | AnimalSpecies = 'All';

  readonly reportSummary = computed(() => ({
    all: this.reports().length,
    matches: this.reports().reduce((total, report) => total + report.matchCount, 0),
    pending: this.reports().filter((report) => report.verificationStatus === 'Pending').length,
    rejected: this.reports().filter((report) => report.verificationStatus === 'Rejected').length,
    verified: this.reports().filter((report) => report.verificationStatus === 'Verified').length,
  }));

  readonly filteredReports = computed(() =>
    this.reports().filter((report) => {
      const query =
        `${report.reference} ${report.title} ${report.approximateLocationLabel}`.toLowerCase();
      return (
        query.includes(this.query.trim().toLowerCase()) &&
        (this.status === 'All' || report.lifecycleStatus === this.status) &&
        (this.verification === 'All' || report.verificationStatus === this.verification) &&
        (this.species === 'All' || report.species === this.species)
      );
    }),
  );

  constructor() {
    void this.loadReports();
  }

  clearFilters(): void {
    this.query = '';
    this.status = 'All';
    this.verification = 'All';
    this.species = 'All';
  }

  async loadReports(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.sightingsApi.mySightings({ pageSize: 50 }));
      this.reports.set(response.items.map(toUserReportView));
      this.uiState.set('default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
    }
  }

  async saveEdit(event: { id: string; changes: UpdateSightingRequest }): Promise<void> {
    const report = this.editingReport();
    if (!report?.editable) {
      return;
    }

    try {
      await firstValueFrom(
        this.sightingsApi.update(
          event.id,
          toUpdateSightingRequest({
            color: event.changes.color ?? report.color,
            description: event.changes.description ?? report.description,
            pattern: event.changes.pattern ?? report.pattern,
          }),
        ),
      );
      this.editingReport.set(null);
      await this.loadReports();
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
      this.editingReport.set(null);
    }
  }

  async deletePhoto(event: { id: string; photoId: string }): Promise<void> {
    const report = this.editingReport();
    if (!report?.editable || report.id !== event.id) {
      return;
    }

    try {
      await firstValueFrom(this.sightingsApi.deletePhoto(event.id, event.photoId));
      await this.loadReports();
      const refreshed = this.reports().find((item) => item.id === event.id) ?? null;
      this.editingReport.set(refreshed);
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set('error');
      this.editingReport.set(null);
    }
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Reports could not be loaded. Please try again.';
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }

  const body = error.error as { message?: string | string[] } | null;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Reports could not be loaded. Please try again.';
}
