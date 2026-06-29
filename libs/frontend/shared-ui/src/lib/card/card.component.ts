import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-card',
  standalone: true,
  template: `
    <section [class]="compact() ? 'card card--compact' : 'card'">
      <ng-content />
    </section>
  `,
  styles: [
    `
      .card {
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-card);
        background: var(--color-surface);
        padding: 1.5rem;
        box-shadow: var(--shadow-card);
      }

      .card--compact {
        padding: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly compact = input(false);
}
