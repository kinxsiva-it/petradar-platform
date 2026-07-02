import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { PossibleMatchCardComponent } from '../../components/possible-match-card/possible-match-card.component.js';
import {
  LostPetsApiService,
  matchLevelLabel,
  toLostPetMatchView,
  toLostPetView,
  toUserMessage,
  type ApiMatchLevel,
  type LostPetMatchView,
  type LostPetView,
} from '../../data-access/index.js';

@Component({
  selector: 'pr-possible-matches-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    PossibleMatchCardComponent,
    RouterLink,
  ],
  styleUrl: './possible-matches-page.component.css',
  templateUrl: './possible-matches-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PossibleMatchesPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly lostPetsApi = inject(LostPetsApiService);
  readonly pet = signal<LostPetView | null>(null);
  readonly matchItems = signal<LostPetMatchView[]>([]);
  readonly levelOptions: ('All' | ApiMatchLevel)[] = ['All', 'HIGH', 'MEDIUM', 'LOW'];
  readonly uiState = signal<'default' | 'loading' | 'error' | 'not-found'>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly matching = signal(false);
  level: 'All' | ApiMatchLevel = 'All';

  constructor() {
    void this.loadPage();
  }

  readonly matches = computed(() => {
    return this.matchItems().filter((match) => this.level === 'All' || match.level === this.level);
  });

  levelLabel(level: 'All' | ApiMatchLevel): string {
    return level === 'All' ? 'All' : matchLevelLabel(level);
  }

  async loadPage(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.uiState.set('not-found');
      return;
    }

    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const [pet, matches] = await Promise.all([
        firstValueFrom(this.lostPetsApi.getMyLostPet(id)),
        firstValueFrom(this.lostPetsApi.getLostPetMatches(id)),
      ]);
      const matchViews = matches.items.map(toLostPetMatchView);
      this.pet.set(toLostPetView(pet, matchViews.length));
      this.matchItems.set(matchViews);
      this.uiState.set('default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Possible matches could not be loaded.'));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async runMatching(): Promise<void> {
    const pet = this.pet();
    if (!pet || this.matching()) {
      return;
    }

    this.matching.set(true);
    this.actionMessage.set('');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.lostPetsApi.runMatching(pet.id));
      const matchViews = response.items.map(toLostPetMatchView);
      this.matchItems.set(matchViews);
      this.pet.set({ ...pet, possibleMatchCount: matchViews.length });
      this.actionMessage.set(
        `${matchViews.length} possible match${matchViews.length === 1 ? '' : 'es'} refreshed.`,
      );
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Matching could not be run.'));
    } finally {
      this.matching.set(false);
    }
  }
}
