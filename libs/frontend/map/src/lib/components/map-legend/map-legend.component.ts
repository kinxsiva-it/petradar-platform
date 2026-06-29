import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pr-map-legend',
  standalone: true,
  templateUrl: './map-legend.component.html',
  styleUrl: './map-legend.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLegendComponent {}

