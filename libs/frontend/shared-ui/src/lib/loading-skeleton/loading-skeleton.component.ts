import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-loading-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-list" aria-label="Loading" aria-live="polite">
      @for (item of rowsArray(); track $index) {
        <div class="skeleton-row"></div>
      }
    </div>
  `,
  styles: [
    `
      .skeleton-list {
        display: grid;
        gap: 0.75rem;
      }

      .skeleton-row {
        height: 1rem;
        border-radius: 999px;
        background:
          linear-gradient(
            90deg,
            var(--color-surface-muted),
            color-mix(in srgb, var(--color-border-default) 45%, white),
            var(--color-surface-muted)
          );
        background-size: 220% 100%;
        animation: pulse 1.3s ease-in-out infinite;
      }

      @keyframes pulse {
        0% {
          background-position: 100% 0;
        }

        100% {
          background-position: -100% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {
  readonly rows = input(3);

  rowsArray(): number[] {
    return Array.from({ length: this.rows() });
  }
}
