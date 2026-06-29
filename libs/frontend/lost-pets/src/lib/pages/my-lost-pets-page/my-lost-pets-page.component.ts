import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@petradar/frontend/shared-ui';
import { LostPetStatus, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { MyLostPetCardComponent } from '../../components/my-lost-pet-card/my-lost-pet-card.component.js';

type LostPetStatusFilter = 'All' | LostPetStatus;

@Component({
  selector: 'pr-my-lost-pets-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, MyLostPetCardComponent, RouterLink],
  styleUrl: './my-lost-pets-page.component.css',
  templateUrl: './my-lost-pets-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLostPetsPageComponent {
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly uiState = signal<'default' | 'loading' | 'error'>('default');
  readonly confirmAction = signal<{ id: string; status: LostPetStatus } | null>(null);
  readonly statusOptions: LostPetStatusFilter[] = ['All', 'Active', 'Possible match', 'Reunited', 'Closed'];
  query = '';
  status: LostPetStatusFilter = 'All';

  readonly filteredPets = computed(() =>
    this.workspace.userLostPets().filter((pet) => {
      const target = `${pet.petName} ${pet.reference} ${pet.breed} ${pet.approximateLastSeenLabel}`.toLowerCase();
      return target.includes(this.query.trim().toLowerCase()) && (this.status === 'All' || pet.status === this.status);
    }),
  );

  applyStatus(): void {
    const action = this.confirmAction();
    if (!action) return;
    this.workspace.updateLostPetStatus(action.id, action.status);
    this.workspace.showToast(`Lost pet marked ${action.status.toLowerCase()} in mock state.`);
    this.confirmAction.set(null);
  }
}
