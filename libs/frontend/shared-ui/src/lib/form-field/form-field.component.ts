import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-form-field',
  standalone: true,
  template: `
    <div class="grid gap-2">
      <label [attr.for]="controlId()" class="text-sm font-semibold text-text-strong">{{ label() }}</label>
      <ng-content />
      @if (hint()) {
        <span class="text-xs text-text-muted">{{ hint() }}</span>
      }
      @if (error()) {
        <span class="text-xs font-medium text-danger">{{ error() }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  readonly controlId = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly label = input.required<string>();
}
