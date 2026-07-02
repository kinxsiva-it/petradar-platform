import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface TrendPoint {
  label: string;
  rescues: number;
  sightings: number;
}

@Component({
  selector: 'pr-trend-chart',
  standalone: true,
  template: `
    <figure class="chart-card">
      <figcaption>
        <b>{{ title() }}</b>
        <span>{{ description() }}</span>
      </figcaption>
      <svg viewBox="0 0 520 220" role="img" [attr.aria-label]="summary()">
        <g class="grid">
          @for (line of [40, 85, 130, 175]; track line) {
            <line x1="30" [attr.y1]="line" x2="500" [attr.y2]="line" />
          }
        </g>
        <polyline class="sightings" [attr.points]="sightingPoints()" />
        <polyline class="rescues" [attr.points]="rescuePoints()" />
        @for (point of points(); track point.label; let index = $index) {
          <text [attr.x]="30 + index * 76" y="210">{{ point.label.slice(4) }}</text>
        }
      </svg>
      <p>{{ summary() }}</p>
    </figure>
  `,
  styles: [
    `
      .chart-card {
        min-width: 0;
        margin: 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      figcaption {
        display: grid;
        gap: 0.2rem;
        margin-bottom: 0.7rem;
      }

      b {
        color: var(--color-text-strong);
      }

      span,
      p,
      text {
        color: var(--color-text-muted);
        font: var(--text-caption);
      }

      svg {
        width: 100%;
        height: auto;
        min-height: 13rem;
      }

      line {
        stroke: var(--color-border-default);
      }

      polyline {
        fill: none;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .sightings {
        stroke: var(--color-info);
      }

      .rescues {
        stroke: var(--color-danger);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChartComponent {
  readonly description = input('Sightings and rescue cases over time.');
  readonly points = input.required<TrendPoint[]>();
  readonly title = input('Reports Over Time');
  readonly max = computed(() => Math.max(...this.points().flatMap((item) => [item.sightings, item.rescues]), 1));
  readonly sightingPoints = computed(() => this.points().map((item, index) => `${30 + index * 76},${190 - (item.sightings / this.max()) * 150}`).join(' '));
  readonly rescuePoints = computed(() => this.points().map((item, index) => `${30 + index * 76},${190 - (item.rescues / this.max()) * 150}`).join(' '));
  readonly summary = computed(() => {
    const last = this.points().at(-1);
    return last ? `${last.label} has ${last.sightings} sightings and ${last.rescues} rescue cases.` : 'No chart data.';
  });
}
