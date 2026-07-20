import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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

import type { AdminModerationQueueItem } from '../../data-access/admin-sightings-api.models.js';

const verificationColumnHelper = createColumnHelper<AdminModerationQueueItem>();
const verificationColumns: ColumnDef<AdminModerationQueueItem, string>[] = [
  verificationColumnHelper.accessor('reference', {
    header: 'Report ID',
  }),
  verificationColumnHelper.accessor('id', {
    header: 'Photo',
    id: 'photo',
  }),
  verificationColumnHelper.accessor(speciesValue, {
    header: 'Species',
    id: 'species',
  }),
  verificationColumnHelper.accessor(conditionValue, {
    header: 'Condition',
    id: 'condition',
  }),
  verificationColumnHelper.accessor(() => 'Public approximate area', {
    header: 'Area',
    id: 'area',
  }),
  verificationColumnHelper.accessor((item) => item.reporter.displayName, {
    header: 'Reporter',
    id: 'reporter',
  }),
  verificationColumnHelper.accessor('seenAt', {
    header: 'Seen',
  }),
  verificationColumnHelper.accessor(urgencyValue, {
    header: 'Urgency',
    id: 'urgency',
  }),
  verificationColumnHelper.accessor(verificationStatusValue, {
    header: 'Status',
    id: 'verificationStatus',
  }),
  verificationColumnHelper.accessor('id', {
    header: 'Review',
    id: 'review',
  }),
];
const verificationRowModel = getCoreRowModel<AdminModerationQueueItem>();

function speciesValue(item: AdminModerationQueueItem): string {
  return item.species;
}

function conditionValue(item: AdminModerationQueueItem): string {
  return item.condition;
}

function urgencyValue(item: AdminModerationQueueItem): string {
  return item.urgency;
}

function verificationStatusValue(item: AdminModerationQueueItem): string {
  return item.verificationStatus;
}

@Component({
  selector: 'pr-verification-table',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <section class="table-card">
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
                @if (cell.column.id === 'reference') {
                  <td class="reference-cell">
                    <a [routerLink]="['/verification', row.original.id]" [title]="row.original.reference">
                      {{ row.original.reference }}
                    </a>
                  </td>
                } @else if (cell.column.id === 'photo') {
                  <td>
                    @if (row.original.thumbnailPhoto) {
                      <img [src]="row.original.thumbnailPhoto.url" [alt]="row.original.reference" />
                    } @else {
                      <span class="no-photo">No photo</span>
                    }
                  </td>
                } @else if (cell.column.id === 'seenAt') {
                  <td>{{ row.original.seenAt | date: 'medium' }}</td>
                } @else if (cell.column.id === 'urgency') {
                  <td>
                    <pr-status-badge
                      [label]="row.original.urgency"
                      [tone]="row.original.urgency === 'HIGH' || row.original.urgency === 'EMERGENCY' ? 'danger' : 'warning'"
                    />
                  </td>
                } @else if (cell.column.id === 'verificationStatus') {
                  <td><pr-status-badge [label]="row.original.verificationStatus" tone="match" /></td>
                } @else if (cell.column.id === 'review') {
                  <td class="action-cell">
                    <button
                      type="button"
                      [attr.data-review-id]="row.original.id"
                      (click)="reviewed.emit(row.original)"
                    >
                      Review
                    </button>
                  </td>
                } @else {
                  <td class="truncate-cell" [title]="cellValue(cell)">{{ cellValue(cell) }}</td>
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
      .table-card {
        overflow-x: auto;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        box-shadow: var(--shadow-card);
      }

      table {
        width: 100%;
        min-width: 76rem;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--color-border-default);
        padding: 0.85rem 0.9rem;
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

      img {
        width: 3rem;
        height: 3rem;
        border-radius: var(--radius-card);
        object-fit: cover;
      }

      .no-photo {
        color: var(--color-text-muted);
        font-size: 0.82rem;
      }

      a {
        display: block;
        max-width: 10rem;
        overflow: hidden;
        color: var(--color-primary);
        font-weight: 850;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .truncate-cell {
        max-width: 11rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .action-cell {
        width: 1%;
        white-space: nowrap;
      }

      button {
        min-height: 2.4rem;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
        cursor: pointer;
      }

      @media (max-width: 760px) {
        .table-card {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationTableComponent {
  readonly reports = input.required<AdminModerationQueueItem[]>();
  readonly reviewed = output<AdminModerationQueueItem>();
  readonly table = createAngularTable<AdminModerationQueueItem>(() => ({
    columns: verificationColumns,
    data: this.reports(),
    getCoreRowModel: verificationRowModel,
  }));

  headerLabel(header: Header<AdminModerationQueueItem, unknown>): string {
    const value = header.column.columnDef.header;
    return typeof value === 'string' ? value : '';
  }

  cellValue(cell: Cell<AdminModerationQueueItem, unknown>): string {
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
