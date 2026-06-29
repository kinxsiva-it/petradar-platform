import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminWorkspaceDataSource } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-verification-filter-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="filter-bar" aria-label="Verification filters">
      <input
        type="search"
        [ngModel]="admin.reportFilters().query"
        (ngModelChange)="admin.updateReportFilter('query', $event)"
        placeholder="Search report, animal, reporter, area"
      />
      <select [ngModel]="admin.reportFilters().species" (ngModelChange)="admin.updateReportFilter('species', $event)">
        <option>All</option>
        <option>Cat</option>
        <option>Dog</option>
        <option>Other</option>
      </select>
      <select [ngModel]="admin.reportFilters().condition" (ngModelChange)="admin.updateReportFilter('condition', $event)">
        <option>All</option>
        <option>Normal stray</option>
        <option>Injured</option>
        <option>Newborn litter</option>
      </select>
      <select [ngModel]="admin.reportFilters().urgency" (ngModelChange)="admin.updateReportFilter('urgency', $event)">
        <option>All</option>
        <option>LOW</option>
        <option>MEDIUM</option>
        <option>HIGH</option>
        <option>EMERGENCY</option>
      </select>
      <select
        [ngModel]="admin.reportFilters().verification"
        (ngModelChange)="admin.updateReportFilter('verification', $event)"
      >
        <option>All</option>
        <option>PENDING</option>
        <option>NEEDS_REVIEW</option>
      </select>
      <button type="button" (click)="admin.clearReportFilters()">Clear</button>
    </section>
  `,
  styles: [
    `
      .filter-bar {
        display: grid;
        grid-template-columns: minmax(13rem, 1fr) repeat(4, minmax(8rem, 0.45fr)) auto;
        gap: 0.7rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      .filter-bar > * {
        min-width: 0;
      }

      input,
      select,
      button {
        min-height: 2.75rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-control);
        background: var(--color-surface);
        padding: 0 0.75rem;
      }

      button {
        border-color: var(--color-primary);
        color: var(--color-primary);
        font-weight: 800;
      }

      @media (max-width: 1200px) {
        .filter-bar {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .filter-bar {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationFilterBarComponent {
  readonly admin = inject(AdminWorkspaceDataSource);
}
