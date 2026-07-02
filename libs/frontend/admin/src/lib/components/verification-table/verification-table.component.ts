import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { AdminModerationQueueItem } from '../../data-access/admin-sightings-api.models.js';

@Component({
  selector: 'pr-verification-table',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th scope="col">Report ID</th>
            <th scope="col">Photo</th>
            <th scope="col">Species</th>
            <th scope="col">Condition</th>
            <th scope="col">Area</th>
            <th scope="col">Reporter</th>
            <th scope="col">Seen</th>
            <th scope="col">Urgency</th>
            <th scope="col">Status</th>
            <th scope="col">Review</th>
          </tr>
        </thead>
        <tbody>
          @for (item of reports(); track item.id) {
            <tr>
              <td><a [routerLink]="['/verification', item.id]">{{ item.reference }}</a></td>
              <td>
                @if (item.thumbnailPhoto) {
                  <img [src]="item.thumbnailPhoto.url" [alt]="item.reference" />
                } @else {
                  <span class="no-photo">No photo</span>
                }
              </td>
              <td>{{ item.species }}</td>
              <td>{{ item.condition }}</td>
              <td>Public approximate area</td>
              <td>{{ item.reporter.displayName }}</td>
              <td>{{ item.seenAt | date: 'medium' }}</td>
              <td><pr-status-badge [label]="item.urgency" [tone]="item.urgency === 'HIGH' || item.urgency === 'EMERGENCY' ? 'danger' : 'warning'" /></td>
              <td><pr-status-badge [label]="item.verificationStatus" tone="match" /></td>
              <td><button type="button" (click)="reviewed.emit(item)">Review</button></td>
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
        min-width: 58rem;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--color-border-default);
        padding: 0.75rem;
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
        color: var(--color-primary);
        font-weight: 850;
      }

      button {
        min-height: 2.4rem;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
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
}
