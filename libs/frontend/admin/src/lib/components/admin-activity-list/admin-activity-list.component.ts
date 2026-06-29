import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AdminActivity } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-admin-activity-list',
  standalone: true,
  template: `
    <section class="activity-list">
      <h2>{{ title() }}</h2>
      @for (item of items(); track item.id) {
        <article>
          <span aria-hidden="true" [class.sensitive]="item.sensitive"></span>
          <div>
            <b>{{ item.type }}</b>
            <p>{{ item.summary }}</p>
            <small>{{ item.actor }} · {{ item.entity }} · {{ item.occurredAt }}</small>
          </div>
        </article>
      } @empty {
        <p class="empty">No mock Admin activity yet.</p>
      }
    </section>
  `,
  styles: [
    `
      .activity-list {
        display: grid;
        gap: 0.8rem;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      article {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.75rem;
      }

      article > span {
        width: 0.8rem;
        height: 0.8rem;
        margin-top: 0.25rem;
        border-radius: 999px;
        background: var(--color-primary);
      }

      article > span.sensitive {
        background: var(--color-warning);
      }

      b,
      small {
        display: block;
      }

      b {
        color: var(--color-text-strong);
      }

      small,
      .empty {
        color: var(--color-text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityListComponent {
  readonly items = input.required<AdminActivity[]>();
  readonly title = input('Mock Admin Activity');
}
