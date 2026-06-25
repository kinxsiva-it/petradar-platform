import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-page-header',
  standalone: true,
  template: `
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary">{{ eyebrow() }}</p>
        <h1 class="mt-1 text-3xl font-bold text-text-strong md:text-4xl">{{ title() }}</h1>
        @if (description()) {
          <p class="mt-2 max-w-2xl text-base text-text-muted">{{ description() }}</p>
        }
      </div>
      <ng-content />
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly description = input<string | null>(null);
  readonly eyebrow = input('PetRadar');
  readonly title = input.required<string>();
}
