import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-empty-state',
  standalone: true,
  template: `
    <section class="rounded-card border border-border-default bg-surface p-8 text-center shadow-card">
      <div class="mx-auto grid size-14 place-items-center rounded-full bg-primary-subtle text-2xl text-primary">
        {{ icon() }}
      </div>
      <h2 class="mt-4 text-xl font-semibold text-text-strong">{{ title() }}</h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-text-muted">{{ description() }}</p>
      <div class="mt-5"><ng-content /></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly description = input.required<string>();
  readonly icon = input('i');
  readonly title = input.required<string>();
}
