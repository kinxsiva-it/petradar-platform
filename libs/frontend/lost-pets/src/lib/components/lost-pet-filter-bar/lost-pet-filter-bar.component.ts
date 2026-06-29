import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { DiscoveryFilters } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-lost-pet-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lost-pet-filter-bar.component.html',
  styleUrl: './lost-pet-filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetFilterBarComponent {
  readonly filters = input.required<DiscoveryFilters>();
  readonly filterChanged = output<{ key: keyof DiscoveryFilters; value: string }>();
  readonly clearFilters = output<void>();
}

