import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { AnalyticsChartSegment } from '../../data-access/analytics-api.models.js';

@Component({
  selector: 'pr-distribution-chart',
  standalone: true,
  template: `
    <figure class="distribution-card">
      <figcaption>
        <b>{{ title() }}</b>
        <span>{{ description() }}</span>
      </figcaption>
      <div class="bars" role="img" [attr.aria-label]="summary()">
        @for (segment of segments(); track segment.label) {
          <div>
            <span>{{ segment.label }}</span>
            <div class="track"><i [style.width.%]="percent(segment.value)" [style.background]="segment.color"></i></div>
            <b>{{ segment.value }}</b>
          </div>
        }
      </div>
      <p>{{ summary() }}</p>
    </figure>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .distribution-card {
        display: grid;
        min-width: 0;
        height: 100%;
        grid-template-rows: auto 1fr auto;
        gap: 1rem;
        margin: 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
      }

      figcaption,
      .bars {
        display: grid;
        gap: 0.75rem;
      }

      b {
        color: var(--color-text-strong);
      }

      span,
      p {
        color: var(--color-text-muted);
        font: var(--text-caption);
      }

      .bars > div {
        display: grid;
        grid-template-columns: minmax(5.5rem, 0.8fr) minmax(4rem, 1fr) 2.5rem;
        gap: 0.6rem;
        align-items: center;
      }

      .track {
        height: 0.65rem;
        overflow: hidden;
        border-radius: 999px;
        background: var(--color-surface-muted);
      }

      i {
        display: block;
        height: 100%;
        border-radius: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistributionChartComponent {
  readonly description = input('Platform distribution values.');
  readonly segments = input.required<AnalyticsChartSegment[]>();
  readonly title = input.required<string>();
  readonly total = computed(() => this.segments().reduce((sum, item) => sum + item.value, 0));
  readonly summary = computed(() => `${this.title()} total ${String(this.total())} across ${String(this.segments().length)} categories.`);

  percent(value: number): number {
    return this.total() ? (value / this.total()) * 100 : 0;
  }
}
