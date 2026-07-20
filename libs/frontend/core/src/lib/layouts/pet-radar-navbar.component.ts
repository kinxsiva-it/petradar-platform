import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideGitFork,
  LucideHeart,
  LucideLifeBuoy,
  LucideMap,
  LucideMenu,
  LucidePawPrint,
  LucidePlus,
  LucideX,
} from '@lucide/angular';

import { AuthStateService } from '../auth/auth-state.service.js';
import type { UserRole } from '../auth/auth.models.js';
import { NotificationBellComponent } from '../notifications/notification-bell.component.js';
import { NotificationsApiService } from '../notifications/notifications-api.service.js';
import { AccountMenuComponent } from './account-menu.component.js';

interface NavItem {
  authenticatedOnly?: boolean;
  label: string;
  matchExact?: boolean;
  roles?: readonly UserRole[];
  route: string;
  kind: 'map' | 'matches' | 'report' | 'rescue' | 'lost-pets';
}

const mainNavItems: NavItem[] = [
  { kind: 'map', label: 'Map', matchExact: true, route: '/map' },
  { kind: 'lost-pets', label: 'Lost Pets', route: '/lost-pets' },
  { authenticatedOnly: true, kind: 'matches', label: 'Matches', route: '/matches' },
  { authenticatedOnly: true, kind: 'report', label: 'Report Animal', route: '/report-animal' },
  {
    authenticatedOnly: true,
    kind: 'rescue',
    label: 'Rescue',
    roles: ['VOLUNTEER'],
    route: '/volunteer/rescue-cases',
  },
];

@Component({
  selector: 'pr-petradar-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    AccountMenuComponent,
    NotificationBellComponent,
    LucideGitFork,
    LucideHeart,
    LucideLifeBuoy,
    LucideMap,
    LucideMenu,
    LucidePawPrint,
    LucidePlus,
    LucideX,
  ],
  templateUrl: './pet-radar-navbar.component.html',
  styleUrl: './pet-radar-navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetRadarNavbarComponent {
  readonly auth = inject(AuthStateService);
  readonly menuOpen = signal(false);
  readonly notifications = inject(NotificationsApiService);
  readonly navItems = computed(() => mainNavItems.filter((item) => this.canShow(item)));
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        void this.notifications.refreshUnreadCount().catch(() => this.notifications.clearUnreadCount());
      } else {
        this.notifications.clearUnreadCount();
      }
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    this.menuOpen.set(false);
    await this.router.navigate(['/login']);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private canShow(item: NavItem): boolean {
    if (item.authenticatedOnly && !this.auth.isAuthenticated()) {
      return false;
    }

    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    return item.roles.some((role) => this.auth.roles().includes(role));
  }
}
