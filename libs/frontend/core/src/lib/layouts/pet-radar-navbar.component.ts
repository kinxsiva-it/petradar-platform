import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBell,
  LucideChevronDown,
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
    roles: ['VOLUNTEER', 'ADMIN'],
    route: '/volunteer/rescue-cases',
  },
];

@Component({
  selector: 'pr-petradar-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBell,
    LucideChevronDown,
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
  readonly navItems = computed(() => mainNavItems.filter((item) => this.canShow(item)));
  readonly initials = computed(() => initialsFor(this.auth.user()?.displayName));
  readonly roleLabel = computed(() => this.auth.roles().filter((role) => role !== 'GUEST').join(', '));
  private readonly router = inject(Router);

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

function initialsFor(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return 'PR';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}
