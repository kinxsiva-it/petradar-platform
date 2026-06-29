import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-map-report-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './map-report-cta.component.html',
  styleUrl: './map-report-cta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapReportCtaComponent {}
