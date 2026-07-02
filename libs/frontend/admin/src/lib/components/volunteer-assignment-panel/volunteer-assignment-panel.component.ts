import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { AdminVolunteerCandidate } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-volunteer-assignment-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="assignment-panel">
      <h2>Volunteer Assignment</h2>
      <input type="search" [(ngModel)]="query" placeholder="Search volunteers" />
      <div class="volunteer-list">
        @for (volunteer of filtered(); track volunteer.id) {
          <article [class.selected]="volunteer.id === selectedId()">
            <div>
              <b>{{ volunteer.name }}</b>
              <span>{{ volunteer.roleLabel }} · {{ volunteer.coverageArea }}</span>
              <small>{{ volunteer.availability }} · {{ volunteer.verification }} · {{ volunteer.assignedCount }} active</small>
            </div>
            <button type="button" (click)="selectedId.set(volunteer.id)">Select</button>
          </article>
        } @empty {
          <p>No available volunteers match this search.</p>
        }
      </div>
      <div class="assignment-actions">
        <button type="button" (click)="assignSelected()">Assign</button>
        <button type="button" class="secondary" (click)="removed.emit()">Remove assignment</button>
      </div>
    </section>
  `,
  styles: [
    `
      .assignment-panel {
        display: grid;
        gap: 0.8rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      input {
        min-height: 2.75rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-control);
        padding: 0 0.75rem;
      }

      .volunteer-list {
        display: grid;
        gap: 0.6rem;
        max-height: 21rem;
        overflow: auto;
      }

      article {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.8rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-card);
        padding: 0.75rem;
      }

      article.selected {
        border-color: var(--color-primary);
        background: var(--color-primary-subtle);
      }

      b,
      span,
      small {
        display: block;
      }

      span,
      small {
        color: var(--color-text-muted);
      }

      .assignment-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      button {
        min-height: 2.75rem;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
      }

      .secondary {
        background: var(--color-surface);
        color: var(--color-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolunteerAssignmentPanelComponent {
  readonly assigned = output<AdminVolunteerCandidate>();
  readonly removed = output();
  readonly selectedId = signal('');
  readonly volunteers = input.required<AdminVolunteerCandidate[]>();
  query = '';

  readonly filtered = computed(() => {
    const target = this.query.trim().toLowerCase();
    return this.volunteers().filter((item) =>
      `${item.name} ${item.roleLabel} ${item.coverageArea} ${item.skills.join(' ')}`.toLowerCase().includes(target),
    );
  });

  assignSelected(): void {
    const selected = this.volunteers().find((item) => item.id === this.selectedId());
    if (selected) {
      this.assigned.emit(selected);
    }
  }
}
