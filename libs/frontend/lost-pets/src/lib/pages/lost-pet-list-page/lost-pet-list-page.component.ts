import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DiscoveryFilters, PublicDiscoveryDataSource } from '@petradar/frontend/mock-data';
import { EmptyStateComponent } from '@petradar/frontend/shared-ui';

import { LostPetCardComponent } from '../../components/lost-pet-card/lost-pet-card.component.js';
import { LostPetFilterBarComponent } from '../../components/lost-pet-filter-bar/lost-pet-filter-bar.component.js';

type ListState = 'default' | 'loading' | 'empty' | 'error';

@Component({
  selector: 'pr-lost-pet-list-page',
  standalone: true,
  imports: [EmptyStateComponent, LostPetCardComponent, LostPetFilterBarComponent, RouterLink],
  templateUrl: './lost-pet-list-page.component.html',
  styleUrl: './lost-pet-list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetListPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly dataSource = inject(PublicDiscoveryDataSource);
  readonly uiState = signal<ListState>(
    (this.route.snapshot.queryParamMap.get('uiState') as ListState | null) ?? 'default',
  );

  updateFilter(event: { key: keyof DiscoveryFilters; value: string }): void {
    this.dataSource.updateLostPetFilter(event.key, event.value as DiscoveryFilters[typeof event.key]);
  }
}

