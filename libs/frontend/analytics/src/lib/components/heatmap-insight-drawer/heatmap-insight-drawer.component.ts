import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { HeatmapPointAggregate } from '@petradar/frontend/mock-data';
import { AlertComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-heatmap-insight-drawer',
  standalone: true,
  imports: [AlertComponent],
  template: `
    @if (hotspot(); as item) {
      <aside class="insight-drawer" role="dialog" aria-label="Heatmap insight drawer">
        <button type="button" class="close" (click)="closed.emit()">Close</button>
        <p class="eyebrow">Heatmap Insights</p>
        <h2>{{ item.area }}</h2>
        <section class="metric-grid">
          <article><span>Total reports</span><b>{{ item.reportCount }}</b></article>
          <article><span>Injured</span><b>{{ item.injuredCount }}</b></article>
          <article><span>Rescue needs</span><b>{{ item.rescueNeedCount }}</b></article>
          <article><span>Density</span><b>{{ item.densityScore }}</b></article>
        </section>
        <h3>Recent trend</h3>
        <p>{{ item.recentTrend }}</p>
        <h3>Suggested action</h3>
        <p>{{ item.suggestedAction }}</p>
        <pr-alert title="Privacy aggregation" tone="privacy">
          This drawer uses aggregated fictional cells only. It does not expose exact report coordinates.
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
  readonly hotspot = input<HeatmapPointAggregate | undefined>();
}
