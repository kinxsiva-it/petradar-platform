import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';

interface AdminNavItem {
  label: string;
  route: string;
  marker: string;
  count?: () => number;
}

@Component({
  selector: 'pr-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './admin-layout.component.css',
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
  readonly menuOpen = signal(false);
  readonly pendingCount = computed(() => this.admin.pendingReports().length);
  readonly navItems: AdminNavItem[] = [
    { label: 'Verification', marker: 'V', route: '/admin/verification', count: this.pendingCount },
    { label: 'Rescue Cases', marker: 'R', route: '/admin/rescue-cases' },
    { label: 'Heatmap', marker: 'H', route: '/admin/heatmap' },
    { label: 'Analytics', marker: 'A', route: '/admin/analytics' },
    { label: 'Reports', marker: 'E', route: '/admin/reports' },
    { label: 'Users', marker: 'U', route: '/admin/users' },
    { label: 'Privacy', marker: 'P', route: '/admin/privacy' },
  ];

  signOut(): void {
    this.admin.showToast('Mock sign-out only. No real session was ended.');
  }
}
