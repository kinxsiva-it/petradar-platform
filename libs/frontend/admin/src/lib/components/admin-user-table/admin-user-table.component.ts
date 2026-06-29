import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AdminManagedUser } from '@petradar/frontend/mock-data';
import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-admin-user-table',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="user-table">
      <table>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Email</th>
            <th scope="col">Roles</th>
            <th scope="col">Account</th>
            <th scope="col">Volunteer</th>
            <th scope="col">Reports</th>
            <th scope="col">Detail</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr>
              <td class="person"><img [src]="user.avatarUrl" alt="" /><span>{{ user.name }}</span></td>
              <td class="email">{{ user.email }}</td>
              <td>{{ user.roles.join(', ') }}</td>
              <td><pr-status-badge [label]="user.accountStatus" [tone]="user.accountStatus === 'ACTIVE' ? 'success' : 'warning'" /></td>
              <td><pr-status-badge [label]="user.volunteerVerification" tone="match" /></td>
              <td>{{ user.reportCount }}</td>
              <td><a [routerLink]="['/admin/users', user.id]">Open</a></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `
      .user-table {
        overflow-x: auto;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        box-shadow: var(--shadow-card);
      }

      table {
        width: 100%;
        min-width: 54rem;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--color-border-default);
        padding: 0.8rem;
        text-align: left;
      }

      th {
        color: var(--color-text-muted);
        font: var(--text-caption);
      }

      .person {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--color-text-strong);
        font-weight: 850;
      }

      img {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 999px;
        object-fit: cover;
      }

      .email {
        overflow-wrap: anywhere;
      }

      a {
        color: var(--color-primary);
        font-weight: 850;
      }

      @media (max-width: 760px) {
        .user-table {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserTableComponent {
  readonly users = input.required<AdminManagedUser[]>();
}
