import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'pr-match-score-ring',
  standalone: true,
  styleUrl: './match-score-ring.component.css',
  templateUrl: './match-score-ring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchScoreRingComponent {
  readonly score = input.required<number>();
  readonly level = input.required<string>();
  readonly background = computed(
    () => `conic-gradient(var(--color-match) ${String(this.score())}%, var(--color-match-subtle) 0)`,
  );
}
