import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStateService } from '@petradar/frontend/core';

interface CmsNavItem {
  exact?: boolean;
  label: string;
  marker: string;
  route: string;
}

const cmsNavItems: CmsNavItem[] = [
  { label: 'Dashboard', marker: 'D', route: '/dashboard' },
  { label: 'Verification Queue', marker: 'V', route: '/verification' },
  { label: 'Rescue Cases', marker: 'R', route: '/rescue-cases' },
  { label: 'Volunteers', marker: 'M', route: '/volunteers' },
  { label: 'Users & Roles', marker: 'U', route: '/users' },
  { label: 'Lost Pet Matches', marker: 'L', route: '/match-review' },
  { label: 'Analytics', marker: 'A', route: '/analytics' },
  { label: 'Hotspots', marker: 'H', route: '/heatmap' },
  { label: 'Privacy & Moderation', marker: 'P', route: '/privacy' },
  { label: 'Audit Logs', marker: 'G', route: '/audit-logs' },
];

@Component({
  selector: 'pr-admin-cms-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './admin-cms-shell.component.css',
  templateUrl: './admin-cms-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCmsShellComponent {
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);
  readonly navItems = cmsNavItems;
  readonly displayName = computed(() => this.auth.user()?.displayName ?? 'Admin');
  readonly roleLabel = computed(() => this.auth.roles().filter((role) => role !== 'GUEST').join(', ') || 'Admin');

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    this.sidebarOpen.set(false);
    await this.router.navigate(['/login']);
  }
}
