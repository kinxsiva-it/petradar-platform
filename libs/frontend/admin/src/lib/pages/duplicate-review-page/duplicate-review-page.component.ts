import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';
import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { DuplicateComparisonComponent } from '../../components/duplicate-comparison/duplicate-comparison.component.js';

@Component({
  selector: 'pr-duplicate-review-page',
  standalone: true,
  imports: [AlertComponent, DuplicateComparisonComponent, EmptyStateComponent, LoadingSkeletonComponent, RouterLink],
  styleUrl: './duplicate-review-page.component.css',
  templateUrl: './duplicate-review-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateReviewPageComponent {
  private readonly router = inject(Router);
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly id = this.router.url.split('/').pop()?.split('?')[0] ?? null;
  readonly suggestion = computed(() => this.admin.findDuplicate(this.id));
  readonly primary = computed(() => this.admin.findReport(this.suggestion()?.primaryReportId ?? null));
  readonly candidate = computed(() => this.admin.findReport(this.suggestion()?.candidateReportId ?? null));
  readonly selectedParent = signal<string | null>(null);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');

  confirm(): void {
    const suggestion = this.suggestion();
    if (!suggestion) {
      return;
    }
    this.admin.updateDuplicateState(suggestion.id, 'CONFIRMED', this.selectedParent() ?? suggestion.primaryReportId);
  }
}
