import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { DiscoveryFilters } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-map-filter-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './map-filter-panel.component.html',
  styleUrl: './map-filter-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapFilterPanelComponent {
  readonly filters = input.required<DiscoveryFilters>();
  readonly filterChanged = output<{ key: keyof DiscoveryFilters; value: string }>();
  readonly clearFilters = output<void>();
}

