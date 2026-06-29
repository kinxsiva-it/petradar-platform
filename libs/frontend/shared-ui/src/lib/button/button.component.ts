import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

const variantClasses: Record<ButtonVariant, string> = {
  danger: 'button button--danger',
  ghost: 'button button--ghost',
  primary: 'button button--primary',
  secondary: 'button button--secondary',
  tertiary: 'button button--tertiary',
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'button--lg',
  md: 'button--md',
  sm: 'button--sm',
};

@Component({
  selector: 'pr-button',
  standalone: true,
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="classes()">
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      :host(.full-width-host) {
        display: block;
        width: 100%;
      }

      .button {
        display: inline-flex;
        width: auto;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid transparent;
        border-radius: var(--radius-control);
        font-weight: 800;
        line-height: 1;
        text-decoration: none;
        transition:
          background-color 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }

      .button:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .button--primary {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: white;
        box-shadow: var(--shadow-card);
      }

      .button--primary:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .button--secondary {
        border-color: var(--color-primary);
        background: var(--color-surface);
        color: var(--color-primary);
      }

      .button--secondary:hover:not(:disabled) {
        background: var(--color-primary-subtle);
      }

      .button--tertiary {
        border-color: var(--color-border-default);
        background: var(--color-surface-muted);
        color: var(--color-text-strong);
      }

      .button--tertiary:hover:not(:disabled) {
        background: var(--color-surface);
      }

      .button--ghost {
        background: transparent;
        color: var(--color-primary);
      }

      .button--ghost:hover:not(:disabled) {
        background: var(--color-primary-subtle);
      }

      .button--danger {
        border-color: var(--color-danger);
        background: var(--color-danger);
        color: white;
        box-shadow: var(--shadow-card);
      }

      .button--danger:hover:not(:disabled) {
        background: #dc2626;
      }

      .button--lg {
        min-height: 3rem;
        padding: 0 1.5rem;
        font-size: 1rem;
      }

      .button--md {
        min-height: 2.75rem;
        padding: 0 1rem;
        font-size: 0.875rem;
      }

      .button--sm {
        min-height: 2.25rem;
        padding: 0 0.75rem;
        font-size: 0.875rem;
      }

      .button--full {
        width: 100%;
      }
    `,
  ],
  host: {
    '[class.full-width-host]': 'fullWidth()',
  },
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
      variantClasses[this.variant()],
      sizeClasses[this.size()],
      this.fullWidth() ? 'button--full' : '',
    ].join(' '),
  );
}
