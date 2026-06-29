import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pr-map-result-count',
  standalone: true,
  templateUrl: './map-result-count.component.html',
  styleUrl: './map-result-count.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapResultCountComponent {
  readonly count = input.required<number>();
}
