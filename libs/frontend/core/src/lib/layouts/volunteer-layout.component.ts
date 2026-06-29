import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { RescueWorkflowDataSource, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { AuthStateService } from '../auth/auth-state.service.js';

interface VolunteerNavItem {
  label: string;
  route: string;
  icon: string;
}

const volunteerNavItems: VolunteerNavItem[] = [
  { icon: 'H', label: 'Volunteer Home', route: '/volunteer' },
  { icon: 'R', label: 'Rescue Cases', route: '/volunteer/rescue-cases' },
  { icon: 'M', label: 'Community Map', route: '/map' },
  { icon: 'N', label: 'Notifications', route: '/notifications' },
  { icon: 'P', label: 'Volunteer Profile', route: '/volunteer/profile' },
];

@Component({
  selector: 'pr-volunteer-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './volunteer-layout.component.css',
  templateUrl: './volunteer-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerLayoutComponent {
  readonly auth = inject(AuthStateService);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly navItems = volunteerNavItems;
  readonly mobileItems = volunteerNavItems;
  private readonly router = inject(Router);

  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
