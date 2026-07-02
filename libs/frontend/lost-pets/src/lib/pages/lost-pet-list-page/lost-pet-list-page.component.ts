import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { LostPetCardComponent } from '../../components/lost-pet-card/lost-pet-card.component.js';
import {
  LostPetFilterBarComponent,
  type LostPetFilterChange,
} from '../../components/lost-pet-filter-bar/lost-pet-filter-bar.component.js';
import {
  LostPetsApiService,
  toLostPetView,
  toUserMessage,
  type LostPetListFilters,
  type LostPetView,
} from '../../data-access/index.js';

type ListState = 'default' | 'loading' | 'empty' | 'error';

@Component({
  selector: 'pr-lost-pet-list-page',
  standalone: true,
  imports: [
    EmptyStateComponent,
    LoadingSkeletonComponent,
    LostPetCardComponent,
    LostPetFilterBarComponent,
    RouterLink,
  ],
  templateUrl: './lost-pet-list-page.component.html',
  styleUrl: './lost-pet-list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPetListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly lostPetsApi = inject(LostPetsApiService);
  private requestVersion = 0;

  readonly filters = signal<LostPetListFilters>({
    page: 1,
    pageSize: 25,
    query: this.route.snapshot.queryParamMap.get('query') ?? undefined,
  });
  readonly items = signal<LostPetView[]>([]);
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly uiState = signal<ListState>('loading');
  readonly errorMessage = signal('');
  readonly hasFilters = computed(() => {
    const filters = this.filters();
    return Boolean(filters.query || filters.species || filters.status);
  });

  constructor() {
    void this.loadLostPets();
  }

  updateFilter(event: LostPetFilterChange): void {
    this.filters.update((filters) => {
      const next: LostPetListFilters = { ...filters, page: 1 };
      if (event.key === 'query') {
        const query = event.value.trim();
        next.query = query || undefined;
      }
      if (event.key === 'species') next.species = event.value || undefined;
      if (event.key === 'status') next.status = event.value || undefined;
      return next;
    });
    void this.loadLostPets();
  }

  clearFilters(): void {
    this.filters.set({ page: 1, pageSize: this.filters().pageSize });
    void this.loadLostPets();
  }

  nextPage(): void {
    const next = (this.filters().page ?? 1) + 1;
    if (next > this.totalPages()) {
      return;
    }
    this.filters.update((filters) => ({ ...filters, page: next }));
    void this.loadLostPets();
  }

  async loadLostPets(): Promise<void> {
    const version = ++this.requestVersion;
    this.uiState.set('loading');
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(this.lostPetsApi.listLostPets(this.filters()));
      if (version !== this.requestVersion) {
        return;
      }
      this.items.set(response.items.map((item) => toLostPetView(item)));
      this.total.set(response.total);
      this.totalPages.set(response.totalPages);
      this.uiState.set(response.items.length === 0 && !this.hasFilters() ? 'empty' : 'default');
    } catch (error) {
      if (version !== this.requestVersion) {
        return;
      }
      this.errorMessage.set(toListMessage(error));
      this.uiState.set('error');
    }
  }
}

function toListMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 400) {
    return 'Check the lost-pet filters and try again.';
  }
  return toUserMessage(error, 'Lost pets could not be loaded. Please try again.');
}

