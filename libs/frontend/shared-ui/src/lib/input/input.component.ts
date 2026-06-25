import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type InputType = 'email' | 'number' | 'password' | 'search' | 'text' | 'url';

@Component({
  selector: 'pr-input',
  standalone: true,
  template: `
    <input
      [attr.autocomplete]="autocomplete()"
      [attr.name]="name()"
      [placeholder]="placeholder()"
      [type]="type()"
      class="min-h-11 w-full rounded-control border border-border-default bg-surface px-3 text-sm text-text-strong shadow-sm transition placeholder:text-text-muted focus:border-primary"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  readonly autocomplete = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly placeholder = input('');
  readonly type = input<InputType>('text');
}
