import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { AdminModerationFilters } from '../../data-access/admin-sightings-api.models.js';

@Component({
  selector: 'pr-verification-filter-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="filter-bar" aria-label="Verification filters">
      <input
        type="search"
        [ngModel]="filters().query ?? ''"
        (ngModelChange)="change('query', $event)"
        placeholder="Search report, animal, reporter, area"
      />
      <select [ngModel]="filters().species ?? 'All'" (ngModelChange)="change('species', $event)">
        <option value="All">All</option>
        <option value="CAT">Cat</option>
        <option value="DOG">Dog</option>
        <option value="OTHER">Other</option>
      </select>
      <select [ngModel]="filters().condition ?? 'All'" (ngModelChange)="change('condition', $event)">
        <option value="All">All</option>
        <option value="NORMAL_STRAY">Normal stray</option>
        <option value="INJURED">Injured</option>
        <option value="NEWBORN_LITTER">Newborn litter</option>
        <option value="NEEDS_RESCUE">Needs rescue</option>
        <option value="UNKNOWN">Unknown</option>
      </select>
      <select [ngModel]="filters().urgency ?? 'All'" (ngModelChange)="change('urgency', $event)">
        <option value="All">All</option>
        <option value="LOW">LOW</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HIGH">HIGH</option>
        <option value="EMERGENCY">EMERGENCY</option>
      </select>
      <select
        [ngModel]="filters().verificationStatus ?? 'All'"
        (ngModelChange)="change('verificationStatus', $event)"
      >
        <option value="All">All</option>
        <option value="PENDING">PENDING</option>
        <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
        <option value="VERIFIED">VERIFIED</option>
        <option value="REJECTED">REJECTED</option>
      </select>
      <button type="button" (click)="cleared.emit()">Clear</button>
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
  readonly filters = input.required<AdminModerationFilters>();
  readonly filtersChanged = output<AdminModerationFilters>();
  readonly cleared = output();

  change(key: keyof AdminModerationFilters, value: string): void {
    this.filtersChanged.emit({
      ...this.filters(),
      [key]: value === 'All' || value === '' ? undefined : value,
      page: 1,
    });
  }
}
