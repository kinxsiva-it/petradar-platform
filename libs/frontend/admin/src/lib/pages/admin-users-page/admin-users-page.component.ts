import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';
import { EmptyStateComponent, LoadingSkeletonComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import { AdminSummaryCardComponent } from '../../components/admin-summary-card/admin-summary-card.component.js';
import { AdminUserTableComponent } from '../../components/admin-user-table/admin-user-table.component.js';

@Component({
  selector: 'pr-admin-users-page',
  standalone: true,
  imports: [AdminSummaryCardComponent, AdminUserTableComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink, StatusBadgeComponent],
  styleUrl: './admin-users-page.component.css',
  templateUrl: './admin-users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPageComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly uiState = signal(new URLSearchParams(window.location.search).get('uiState') ?? 'ready');
}
