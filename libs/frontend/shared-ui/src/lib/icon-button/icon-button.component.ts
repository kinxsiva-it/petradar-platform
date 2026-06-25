import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type IconButtonVariant = 'primary' | 'secondary' | 'ghost';

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-text-default hover:bg-surface-muted',
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-border-default bg-surface text-text-strong hover:bg-surface-muted',
};

@Component({
  selector: 'pr-icon-button',
  standalone: true,
  template: `
    <button type="button" [attr.aria-label]="label()" [disabled]="disabled()" [class]="classes()">
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  readonly disabled = input(false);
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('secondary');

  readonly classes = computed(() =>
    [
      'inline-flex size-11 items-center justify-center rounded-control transition disabled:cursor-not-allowed disabled:opacity-55',
      variantClasses[this.variant()],
    ].join(' '),
  );
}
