import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-card',
  standalone: true,
  template: `
    <section
      [class]="compact() ? 'rounded-card border border-border-default bg-surface p-4 shadow-card' : 'rounded-card border border-border-default bg-surface p-6 shadow-card'"
    >
      <ng-content />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly compact = input(false);
}
