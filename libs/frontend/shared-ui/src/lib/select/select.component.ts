import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'pr-select',
  standalone: true,
  template: `
    <select
      [attr.name]="name()"
      class="min-h-11 w-full rounded-control border border-border-default bg-surface px-3 text-sm text-text-strong shadow-sm transition focus:border-primary"
    >
      @for (option of options(); track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
      }
    </select>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  readonly name = input<string | null>(null);
  readonly options = input<SelectOption[]>([]);
}
