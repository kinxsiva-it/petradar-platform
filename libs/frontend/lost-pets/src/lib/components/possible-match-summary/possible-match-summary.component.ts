import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-possible-match-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './possible-match-summary.component.html',
  styleUrl: './possible-match-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PossibleMatchSummaryComponent {
  readonly count = input.required<number>();
  readonly petId = input.required<string>();
}

