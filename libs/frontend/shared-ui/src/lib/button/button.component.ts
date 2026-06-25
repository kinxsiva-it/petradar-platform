import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

const variantClasses: Record<ButtonVariant, string> = {
  danger: 'bg-danger text-white shadow-card hover:bg-red-600',
  ghost: 'bg-transparent text-primary hover:bg-primary-subtle',
  primary: 'bg-primary text-white shadow-card hover:bg-primary-hover',
  secondary: 'border border-primary bg-surface text-primary hover:bg-primary-subtle',
  tertiary: 'border border-border-default bg-surface-muted text-text-strong hover:bg-surface',
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'min-h-12 px-6 text-base',
  md: 'min-h-11 px-4 text-sm',
  sm: 'min-h-9 px-3 text-sm',
};

@Component({
  selector: 'pr-button',
  standalone: true,
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="classes()">
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly disabled = input(false);
  readonly fullWidth = input(false);
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>('primary');

  readonly classes = computed(() =>
    [
      'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
      variantClasses[this.variant()],
      sizeClasses[this.size()],
      this.fullWidth() ? 'w-full' : '',
    ].join(' '),
  );
}
