import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthStateService } from '@petradar/frontend/core';
import { AlertComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-profile-page',
  standalone: true,
  imports: [AlertComponent, DatePipe, StatusBadgeComponent],
  styleUrl: './profile-page.component.css',
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  readonly auth = inject(AuthStateService);
  readonly initials = computed(() => initialsFor(this.auth.user()?.displayName));
}

function initialsFor(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) {
    return 'PR';
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}
