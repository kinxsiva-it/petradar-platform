import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-admin-summary-card',
  standalone: true,
  template: `
    <article class="summary-card">
      <span>{{ label() }}</span>
      <strong>{{ value() }}</strong>
      <small>{{ detail() }}</small>
    </article>
  `,
  styles: [
    `
      .summary-card {
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
        font-size: 1.8rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSummaryCardComponent {
  readonly detail = input('');
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
}
