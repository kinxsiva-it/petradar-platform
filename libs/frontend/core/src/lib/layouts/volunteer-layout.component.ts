import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { RescueWorkflowDataSource, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

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
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly navItems = volunteerNavItems;
  readonly mobileItems = volunteerNavItems;

  signOutMock(): void {
    this.rescue.showToast('Mock volunteer sign-out action only.');
  }
}
