import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideChartNoAxesColumn,
  LucideFlame,
  LucideGitFork,
  LucideHandHeart,
  LucideLayoutDashboard,
  LucideLifeBuoy,
  LucidePawPrint,
  LucideScrollText,
  LucideShield,
  LucideShieldCheck,
  LucideUserCog,
} from '@lucide/angular';

import { AuthStateService } from '@petradar/frontend/core';

interface CmsNavItem {
  exact?: boolean;
  icon: 'analytics' | 'audit' | 'dashboard' | 'hotspots' | 'matches' | 'privacy' | 'rescue' | 'users' | 'verification' | 'volunteers';
  label: string;
  route: string;
}

const cmsNavItems: CmsNavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
  { icon: 'verification', label: 'Verification Queue', route: '/verification' },
  { icon: 'rescue', label: 'Rescue Cases', route: '/rescue-cases' },
  { icon: 'volunteers', label: 'Volunteers', route: '/volunteers' },
  { icon: 'users', label: 'Users & Roles', route: '/users' },
  { icon: 'matches', label: 'Lost Pet Matches', route: '/match-review' },
  { icon: 'analytics', label: 'Analytics', route: '/analytics' },
  { icon: 'hotspots', label: 'Hotspots', route: '/heatmap' },
  { icon: 'privacy', label: 'Privacy & Moderation', route: '/privacy' },
  { icon: 'audit', label: 'Audit Logs', route: '/audit-logs' },
];

@Component({
  selector: 'pr-admin-cms-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideChartNoAxesColumn,
    LucideFlame,
    LucideGitFork,
    LucideHandHeart,
    LucideLayoutDashboard,
    LucideLifeBuoy,
    LucidePawPrint,
    LucideScrollText,
    LucideShield,
    LucideShieldCheck,
    LucideUserCog,
  ],
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
