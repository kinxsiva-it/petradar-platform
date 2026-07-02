import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AlertComponent, EmptyStateComponent, LoadingSkeletonComponent } from '@petradar/frontend/shared-ui';

import { MyLostPetCardComponent } from '../../components/my-lost-pet-card/my-lost-pet-card.component.js';
import {
  LostPetsApiService,
  lostPetStatusLabel,
  toAuthorizedLostPetView,
  toUserMessage,
  type ApiLostPetStatus,
  type AuthorizedLostPetView,
} from '../../data-access/index.js';

type LostPetStatusFilter = 'All' | ApiLostPetStatus;

@Component({
  selector: 'pr-my-lost-pets-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    LoadingSkeletonComponent,
    MyLostPetCardComponent,
    RouterLink,
  ],
  styleUrl: './my-lost-pets-page.component.css',
  templateUrl: './my-lost-pets-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLostPetsPageComponent {
  private readonly lostPetsApi = inject(LostPetsApiService);
  readonly pets = signal<AuthorizedLostPetView[]>([]);
  readonly uiState = signal<'default' | 'loading' | 'error'>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly updating = signal(false);
  readonly confirmAction = signal<{ id: string; status: ApiLostPetStatus } | null>(null);
  readonly statusOptions: LostPetStatusFilter[] = ['All', 'LOST', 'POSSIBLE_MATCH', 'REUNITED', 'CLOSED'];
  query = '';
  status: LostPetStatusFilter = 'All';

  constructor() {
    void this.loadPets();
  }

  readonly filteredPets = computed(() =>
    this.pets().filter((pet) => {
      const target = `${pet.petName} ${pet.reference} ${pet.breed ?? ''} ${pet.approximateLastSeenLabel}`.toLowerCase();
      return target.includes(this.query.trim().toLowerCase()) && (this.status === 'All' || pet.apiStatus === this.status);
    }),
  );

  readonly summary = computed(() => ({
    active: this.pets().filter((pet) => pet.apiStatus === 'LOST').length,
    matches: this.pets().filter((pet) => pet.apiStatus === 'POSSIBLE_MATCH').length,
    reunited: this.pets().filter((pet) => pet.apiStatus === 'REUNITED').length,
  }));

  statusLabel(status: LostPetStatusFilter): string {
    return status === 'All' ? 'All' : lostPetStatusLabel(status);
  }

  async loadPets(): Promise<void> {
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.lostPetsApi.listMyLostPets({ pageSize: 50 }));
      this.pets.set(response.items.map((item) => toAuthorizedLostPetView(item)));
      this.uiState.set('default');
    } catch (error) {
      this.errorMessage.set(toMyPetsMessage(error));
      this.uiState.set('error');
    }
  }

  async applyStatus(): Promise<void> {
    const action = this.confirmAction();
    if (!action || this.updating()) return;

    this.updating.set(true);
    this.actionMessage.set('');
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.lostPetsApi.updateLostPet(action.id, { status: action.status }));
      this.actionMessage.set(`Lost pet marked ${lostPetStatusLabel(action.status).toLowerCase()}.`);
      this.confirmAction.set(null);
      await this.loadPets();
    } catch (error) {
      this.errorMessage.set(toUserMessage(error, 'Lost-pet status could not be updated.'));
    } finally {
      this.updating.set(false);
    }
  }
}

function toMyPetsMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return 'Sign in to view your lost-pet posts.';
  }
  return toUserMessage(error, 'Your lost-pet posts could not be loaded.');
}
