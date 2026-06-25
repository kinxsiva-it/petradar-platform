import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-loading-skeleton',
  standalone: true,
  template: `
    <div class="grid gap-3" aria-label="Loading" aria-live="polite">
      @for (item of rowsArray(); track $index) {
        <div class="h-4 animate-pulse rounded-full bg-surface-muted"></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {
  readonly rows = input(3);

  rowsArray(): number[] {
    return Array.from({ length: this.rows() });
  }
}
