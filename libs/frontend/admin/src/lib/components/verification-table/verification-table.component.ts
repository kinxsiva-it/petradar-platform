import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AdminReport } from '@petradar/frontend/mock-data';
import { StatusBadgeComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-verification-table',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
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
            <th scope="col">Duplicate</th>
            <th scope="col">Urgency</th>
            <th scope="col">Status</th>
            <th scope="col">Review</th>
          </tr>
        </thead>
        <tbody>
          @for (item of reports(); track item.id) {
            <tr>
              <td><a [routerLink]="['/admin/verification', item.id]">{{ item.reference }}</a></td>
              <td><img [src]="item.photoUrls[0]" [alt]="item.title" /></td>
              <td>{{ item.species }}</td>
              <td>{{ item.condition }}</td>
              <td>{{ item.location.approximateLabel }}</td>
              <td>{{ item.reporter.name }}<small>Trust {{ item.reporter.trustScore }}</small></td>
              <td>{{ item.possibleDuplicateCount ? item.possibleDuplicateCount + ' possible' : 'Low' }}</td>
              <td><pr-status-badge [label]="item.urgency" [tone]="item.urgency === 'HIGH' ? 'danger' : 'warning'" /></td>
              <td><pr-status-badge [label]="item.verification" tone="match" /></td>
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

      small {
        display: block;
        color: var(--color-text-muted);
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
  readonly reports = input.required<AdminReport[]>();
  readonly reviewed = output<AdminReport>();
}
