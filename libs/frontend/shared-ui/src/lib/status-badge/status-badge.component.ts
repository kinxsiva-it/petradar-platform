import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type StatusTone = 'default' | 'danger' | 'match' | 'success' | 'warning';

const toneClasses: Record<StatusTone, string> = {
  danger: 'badge badge--danger',
  default: 'badge badge--default',
  match: 'badge badge--match',
  success: 'badge badge--success',
  warning: 'badge badge--warning',
};

@Component({
  selector: 'pr-status-badge',
  standalone: true,
  template: `
    <span [class]="classes()">
      <span aria-hidden="true" class="dot"></span>
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        min-height: 1.75rem;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 0 0.75rem;
        font-size: 0.75rem;
        font-weight: 800;
        line-height: 1;
        white-space: nowrap;
      }

      .dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: currentColor;
      }

      .badge--default {
        border-color: var(--color-border-default);
        background: var(--color-surface-muted);
        color: var(--color-text-default);
      }

      .badge--danger {
        border-color: var(--color-danger-subtle);
        background: var(--color-danger-subtle);
        color: var(--color-danger);
      }

      .badge--match {
        border-color: var(--color-match-subtle);
        background: var(--color-match-subtle);
        color: var(--color-match);
      }

      .badge--success {
        border-color: var(--color-success-subtle);
        background: var(--color-success-subtle);
        color: var(--color-primary);
      }

      .badge--warning {
        border-color: var(--color-warning-subtle);
        background: var(--color-warning-subtle);
        color: #a16207;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('default');

  readonly classes = computed(() => toneClasses[this.tone()]);
}
