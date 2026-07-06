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
                    <span>{{ row.original.displayName }}</span>
                  </td>
                } @else if (cell.column.id === 'email') {
                  <td class="email">{{ cellValue(cell) }}</td>
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
                  <td><a [routerLink]="['/users', row.original.id]">Open</a></td>
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
