import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type AlertTone = 'danger' | 'info' | 'privacy' | 'success' | 'warning';

const toneClasses: Record<AlertTone, string> = {
  danger: 'alert alert--danger',
  info: 'alert alert--info',
  privacy: 'alert alert--privacy',
  success: 'alert alert--success',
  warning: 'alert alert--warning',
};

@Component({
  selector: 'pr-alert',
  standalone: true,
  template: `
    <section [class]="classes()" role="status">
      <div class="alert-title">{{ title() }}</div>
      <div class="alert-body"><ng-content /></div>
    </section>
  `,
  styles: [
    `
      .alert {
        border: 1px solid transparent;
        border-radius: var(--radius-card);
        padding: 1rem;
        color: var(--color-text-strong);
        box-shadow: 0 1px 2px rgb(31 41 51 / 0.04);
      }

      .alert-title {
        font-weight: 800;
      }

      .alert-body {
        margin-top: 0.25rem;
        color: var(--color-text-default);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .alert--danger {
        border-color: var(--color-danger-subtle);
        background: var(--color-danger-subtle);
      }

      .alert--info {
        border-color: var(--color-info-subtle);
        background: var(--color-info-subtle);
      }

      .alert--privacy {
        border-color: color-mix(in srgb, var(--color-primary) 18%, white);
        background: var(--color-privacy);
      }

      .alert--success {
        border-color: var(--color-success-subtle);
        background: var(--color-success-subtle);
      }

      .alert--warning {
        border-color: var(--color-warning-subtle);
        background: var(--color-warning-subtle);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly title = input.required<string>();
  readonly tone = input<AlertTone>('info');

  readonly classes = computed(() => toneClasses[this.tone()]);
}
