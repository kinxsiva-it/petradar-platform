import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AdminReport, DuplicateSuggestion } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-duplicate-comparison',
  standalone: true,
  template: `
    <section class="duplicate-grid">
      <article class="report-card">
        <p>Original report</p>
        <img [src]="primary().photoUrls[0]" [alt]="primary().title" />
        <h2>{{ primary().reference }}</h2>
        <p>{{ primary().title }}</p>
        <small>{{ primary().location.approximateLabel }}</small>
      </article>
      <article class="score-card">
        <div class="score">{{ suggestion().similarityScore }}%</div>
        <h1>Likely same animal</h1>
        <p>{{ suggestion().approximateDistance }} · {{ suggestion().timeDifference }}</p>
        <h2>Matching traits</h2>
        <ul>
          @for (trait of suggestion().matchingTraits; track trait) {
            <li>{{ trait }}</li>
          }
        </ul>
        <h2>Differences</h2>
        <ul>
          @for (trait of suggestion().differingTraits; track trait) {
            <li>{{ trait }}</li>
          }
        </ul>
      </article>
      <article class="report-card">
        <p>New report</p>
        <img [src]="candidate().photoUrls[0]" [alt]="candidate().title" />
        <h2>{{ candidate().reference }}</h2>
        <p>{{ candidate().title }}</p>
        <small>{{ candidate().location.approximateLabel }}</small>
      </article>
    </section>
  `,
  styles: [
    `
      .duplicate-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.9fr) minmax(0, 1fr);
        gap: 1rem;
      }

      article {
        min-width: 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      img {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: var(--radius-card);
        object-fit: cover;
      }

      h1,
      h2,
      p,
      ul {
        margin: 0;
      }

      h1 {
        color: var(--color-text-strong);
        font: var(--text-heading-2);
      }

      h2 {
        margin-top: 0.8rem;
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      .score-card {
        text-align: center;
      }

      .score {
        width: 8rem;
        height: 8rem;
        display: grid;
        place-items: center;
        margin: 0 auto 1rem;
        border: 0.7rem solid var(--color-primary);
        border-radius: 999px;
        color: var(--color-text-strong);
        font-size: 2rem;
        font-weight: 900;
      }

      ul {
        display: grid;
        gap: 0.35rem;
        padding-left: 1.1rem;
        text-align: left;
      }

      small {
        color: var(--color-text-muted);
      }

      @media (max-width: 900px) {
        .duplicate-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateComparisonComponent {
  readonly candidate = input.required<AdminReport>();
  readonly primary = input.required<AdminReport>();
  readonly suggestion = input.required<DuplicateSuggestion>();
}
