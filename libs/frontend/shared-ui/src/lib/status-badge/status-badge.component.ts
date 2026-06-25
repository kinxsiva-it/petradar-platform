import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type StatusTone = 'default' | 'danger' | 'match' | 'success' | 'warning';

const toneClasses: Record<StatusTone, string> = {
  danger: 'border-danger-subtle bg-danger-subtle text-danger',
  default: 'border-border-default bg-surface-muted text-text-default',
  match: 'border-match-subtle bg-match-subtle text-match',
  success: 'border-success-subtle bg-success-subtle text-primary',
  warning: 'border-warning-subtle bg-warning-subtle text-warning',
};

@Component({
  selector: 'pr-status-badge',
  standalone: true,
  template: `
    <span [class]="classes()">
      <span aria-hidden="true" class="size-2 rounded-full bg-current"></span>
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('default');

  readonly classes = computed(() =>
    [
      'inline-flex min-h-7 items-center gap-2 rounded-full border px-3 text-xs font-semibold',
      toneClasses[this.tone()],
    ].join(' '),
  );
}
