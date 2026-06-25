import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type AlertTone = 'danger' | 'info' | 'privacy' | 'success' | 'warning';

const toneClasses: Record<AlertTone, string> = {
  danger: 'border-danger-subtle bg-danger-subtle text-text-strong',
  info: 'border-blue-100 bg-blue-50 text-text-strong',
  privacy: 'border-teal-100 bg-privacy text-text-strong',
  success: 'border-success-subtle bg-success-subtle text-text-strong',
  warning: 'border-warning-subtle bg-warning-subtle text-text-strong',
};

@Component({
  selector: 'pr-alert',
  standalone: true,
  template: `
    <section [class]="classes()" role="status">
      <div class="font-semibold text-text-strong">{{ title() }}</div>
      <div class="mt-1 text-sm text-text-default"><ng-content /></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly title = input.required<string>();
  readonly tone = input<AlertTone>('info');

  readonly classes = computed(() =>
    ['rounded-card border p-4 shadow-sm', toneClasses[this.tone()]].join(' '),
  );
}
