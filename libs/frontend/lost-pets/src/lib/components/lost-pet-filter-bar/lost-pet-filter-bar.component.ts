import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ApiAnimalSpecies, ApiLostPetStatus, LostPetListFilters } from '../../data-access/index.js';

export type LostPetFilterKey = 'query' | 'species' | 'status';
export type LostPetFilterChange =
  | { key: 'query'; value: string }
  | { key: 'species'; value: ApiAnimalSpecies | '' }
  | { key: 'status'; value: ApiLostPetStatus | '' };

interface FilterOption<TValue extends string> {
  label: string;
  value: TValue | '';
}

@Component({
  selector: 'pr-lost-pet-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lost-pet-filter-bar.component.html',
  styleUrl: './lost-pet-filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetFilterBarComponent {
  readonly filters = input.required<LostPetListFilters>();
  readonly filterChanged = output<LostPetFilterChange>();
  readonly clearFilters = output<void>();

  readonly speciesOptions: FilterOption<ApiAnimalSpecies>[] = [
    { label: 'All species', value: '' },
    { label: 'Cat', value: 'CAT' },
    { label: 'Dog', value: 'DOG' },
    { label: 'Other', value: 'OTHER' },
  ];
  readonly statusOptions: FilterOption<ApiLostPetStatus>[] = [
    { label: 'All statuses', value: '' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Possible match', value: 'POSSIBLE_MATCH' },
    { label: 'Reunited', value: 'REUNITED' },
  ];
}

