import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { AuthStateService } from '../auth/auth-state.service.js';

interface UserNavItem {
  label: string;
  route: string;
  icon: string;
}

const userNavItems: UserNavItem[] = [
  { icon: 'M', label: 'Community Map', route: '/map' },
  { icon: '+', label: 'Report Animal', route: '/report-animal' },
  { icon: 'R', label: 'My Reports', route: '/my/reports' },
  { icon: 'L', label: 'Lost Pets', route: '/my/lost-pets' },
  { icon: 'N', label: 'Notifications', route: '/notifications' },
  { icon: 'P', label: 'Profile', route: '/profile' },
  { icon: 'S', label: 'Settings', route: '/settings' },
];

@Component({
  selector: 'pr-authenticated-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './authenticated-layout.component.css',
  templateUrl: './authenticated-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticatedLayoutComponent {
  readonly auth = inject(AuthStateService);
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly navItems = userNavItems;
  readonly mobileItems = userNavItems.slice(0, 5);
  private readonly router = inject(Router);

  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
