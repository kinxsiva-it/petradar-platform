import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AlertComponent } from '@petradar/frontend/shared-ui';

import type { AnalyticsHotspotPoint } from '../../data-access/analytics-api.models.js';

@Component({
  selector: 'pr-heatmap-insight-drawer',
  standalone: true,
  imports: [AlertComponent],
  template: `
    @if (hotspot(); as item) {
      <aside class="insight-drawer" role="dialog" aria-label="Heatmap insight drawer">
        <button type="button" class="close" (click)="closed.emit()">Close</button>
        <p class="eyebrow">Heatmap Insights</p>
        <h2>{{ item.latitude }}, {{ item.longitude }}</h2>
        <section class="metric-grid">
          <article><span>Total reports</span><b>{{ item.count }}</b></article>
          <article><span>Weighted urgency</span><b>{{ item.weight }}</b></article>
        </section>
        <pr-alert title="Privacy aggregation" tone="privacy">
          These coordinates are rounded public-location aggregates from the analytics API, not exact report coordinates.
        </pr-alert>
      </aside>
    }
  `,
  styles: [
    `
      .insight-drawer {
        display: grid;
        gap: 0.9rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-panel);
      }

      .close {
        justify-self: end;
      }

      .eyebrow,
      h2,
      h3,
      p {
        margin: 0;
      }

      .eyebrow {
        color: var(--color-primary);
        font-weight: 850;
        text-transform: uppercase;
      }

      h2,
      h3 {
        color: var(--color-text-strong);
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.6rem;
      }

      article {
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-card);
        padding: 0.75rem;
      }

      span {
        color: var(--color-text-muted);
        font: var(--text-caption);
      }

      b {
        display: block;
        color: var(--color-text-strong);
        font-size: 1.35rem;
      }

      button {
        min-height: 2.75rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-control);
        background: var(--color-surface);
        padding: 0 0.8rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeatmapInsightDrawerComponent {
  readonly closed = output<void>();
  readonly hotspot = input<AnalyticsHotspotPoint | undefined>();
}
