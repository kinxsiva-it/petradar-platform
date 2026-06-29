import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-empty-state',
  standalone: true,
  template: `
    <section class="empty-state">
      <div class="empty-icon">
        {{ icon() }}
      </div>
      <h2>{{ title() }}</h2>
      <p>{{ description() }}</p>
      <div class="empty-actions"><ng-content /></div>
    </section>
  `,
  styles: [
    `
      .empty-state {
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-card);
        background: var(--color-surface);
        padding: 2rem;
        text-align: center;
        box-shadow: var(--shadow-card);
      }

      .empty-icon {
        display: grid;
        width: 3.5rem;
        height: 3.5rem;
        place-items: center;
        margin: 0 auto;
        border-radius: 999px;
        background: var(--color-primary-subtle);
        color: var(--color-primary);
        font-size: 1.5rem;
        font-weight: 900;
      }

      h2 {
        margin: 1rem 0 0;
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      p {
        max-width: 28rem;
        margin: 0.5rem auto 0;
        color: var(--color-text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .empty-actions {
        margin-top: 1.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly description = input.required<string>();
  readonly icon = input('i');
  readonly title = input.required<string>();
}
