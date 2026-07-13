import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  createAngularTable,
  createColumnHelper,
  getCoreRowModel,
  type Cell,
  type ColumnDef,
  type Header,
} from '@tanstack/angular-table';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { AdminUserSummary } from '../../data-access/admin-users-api.models.js';

const userColumnHelper = createColumnHelper<AdminUserSummary>();
const userColumns: ColumnDef<AdminUserSummary, string>[] = [
  userColumnHelper.accessor('displayName', {
    header: 'User',
  }),
  userColumnHelper.accessor('email', {
    header: 'Email',
  }),
  userColumnHelper.accessor((user) => user.roles.join(', '), {
    header: 'Roles',
    id: 'roles',
  }),
  userColumnHelper.accessor(accountStatusValue, {
    header: 'Account',
    id: 'accountStatus',
  }),
  userColumnHelper.accessor(volunteerVerificationValue, {
    header: 'Volunteer',
    id: 'volunteerVerification',
  }),
  userColumnHelper.accessor((user) => String(user.reportCount), {
    header: 'Reports',
    id: 'reportCount',
  }),
  userColumnHelper.accessor('id', {
    header: 'Detail',
    id: 'detail',
  }),
];
const userRowModel = getCoreRowModel<AdminUserSummary>();

function accountStatusValue(user: AdminUserSummary): string {
  return user.accountStatus;
}

function volunteerVerificationValue(user: AdminUserSummary): string {
  return user.volunteerVerification;
}

@Component({
  selector: 'pr-admin-user-table',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="user-table">
      <table>
        <thead>
          @for (headerGroup of table.getHeaderGroups(); track headerGroup.id) {
            <tr>
              @for (header of headerGroup.headers; track header.id) {
                <th scope="col">{{ headerLabel(header) }}</th>
              }
            </tr>
          }
        </thead>
        <tbody>
          @for (row of table.getRowModel().rows; track row.original.id) {
            <tr>
              @for (cell of row.getVisibleCells(); track cell.id) {
                @if (cell.column.id === 'displayName') {
                  <td class="person">
                    <span class="avatar" aria-hidden="true">{{ initials(row.original.displayName) }}</span>
                    <span class="person-name" [title]="row.original.displayName">{{ row.original.displayName }}</span>
                  </td>
                } @else if (cell.column.id === 'email') {
                  <td class="email" [title]="row.original.email">{{ row.original.email }}</td>
                } @else if (cell.column.id === 'roles') {
                  <td>
                    <div class="role-list" aria-label="Assigned roles">
                      @for (role of row.original.roles; track role) {
                        <span>{{ role }}</span>
                      }
                    </div>
                  </td>
                } @else if (cell.column.id === 'accountStatus') {
                  <td>
                    <pr-status-badge
                      [label]="row.original.accountStatus"
                      [tone]="row.original.accountStatus === 'ACTIVE' ? 'success' : 'warning'"
                    />
                  </td>
                } @else if (cell.column.id === 'volunteerVerification') {
                  <td><pr-status-badge [label]="row.original.volunteerVerification" tone="match" /></td>
                } @else if (cell.column.id === 'detail') {
                  <td class="action-cell">
                    <a
                      [routerLink]="['/users', row.original.id]"
                      [attr.aria-label]="'Open user details for ' + row.original.displayName"
                    >
                      Open detail
                    </a>
                  </td>
                } @else if (cell.column.id === 'reportCount') {
                  <td class="report-count">{{ row.original.reportCount }}</td>
                } @else {
                  <td>{{ cellValue(cell) }}</td>
                }
              }
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
        min-width: 62rem;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--color-border-default);
        padding: 0.75rem 0.85rem;
        text-align: left;
        vertical-align: middle;
      }

      th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--color-surface);
        color: var(--color-text-muted);
        font: var(--text-caption);
        letter-spacing: 0.02em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      tbody tr:hover {
        background: var(--color-surface-muted);
      }

      .person {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--color-text-strong);
        font-weight: 850;
      }

      .person-name,
      .email {
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .avatar {
        display: inline-grid;
        place-items: center;
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 999px;
        background: var(--color-surface-muted);
        color: var(--color-primary);
        font-weight: 900;
      }

      .email {
        max-width: 15rem;
      }

      .role-list {
        display: flex;
        max-width: 13rem;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .role-list span {
        border-radius: 999px;
        background: var(--color-surface-muted);
        color: var(--color-text-muted);
        padding: 0.25rem 0.45rem;
        font-size: 0.7rem;
        font-weight: 800;
      }

      .report-count {
        color: var(--color-text-strong);
        font-weight: 850;
        text-align: center;
      }

      .action-cell {
        width: 1%;
        white-space: nowrap;
      }

      a {
        display: inline-flex;
        min-height: 2.4rem;
        align-items: center;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        color: var(--color-primary);
        padding: 0 0.7rem;
        font-weight: 850;
        text-decoration: none;
      }

      @media (max-width: 820px) {
        .user-table {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserTableComponent {
  readonly users = input.required<AdminUserSummary[]>();
  readonly table = createAngularTable<AdminUserSummary>(() => ({
    columns: userColumns,
    data: this.users(),
    getCoreRowModel: userRowModel,
  }));

  initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  headerLabel(header: Header<AdminUserSummary, unknown>): string {
    const value = header.column.columnDef.header;
    return typeof value === 'string' ? value : '';
  }

  cellValue(cell: Cell<AdminUserSummary, unknown>): string {
    const value = cell.getValue();
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }
}
