import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AdminAnalyticsMetric } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-analytics-summary-grid',
  standalone: true,
  template: `
    <section class="summary-grid">
      @for (metric of metrics(); track metric.label) {
        <article>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small [class]="metric.tone">{{ metric.delta }}</small>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.8rem;
      }

      article {
        min-width: 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-card);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      span,
      small {
        display: block;
        color: var(--color-text-muted);
        font: var(--text-caption);
      }

      strong {
        display: block;
        margin: 0.35rem 0;
        color: var(--color-text-strong);
        font-size: 1.7rem;
      }

      .success {
        color: var(--color-primary);
      }

      .warning {
        color: var(--color-warning);
      }

      .danger {
        color: var(--color-danger);
      }

      .match {
        color: var(--color-match);
      }

      @media (max-width: 1180px) {
        .summary-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 700px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsSummaryGridComponent {
  readonly metrics = input.required<AdminAnalyticsMetric[]>();
}
