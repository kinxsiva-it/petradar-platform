import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@petradar/frontend/shared-ui';
import { MatchLevel, UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { PossibleMatchCardComponent } from '../../components/possible-match-card/possible-match-card.component.js';

@Component({
  selector: 'pr-possible-matches-page',
  standalone: true,
  imports: [EmptyStateComponent, FormsModule, PossibleMatchCardComponent, RouterLink],
  styleUrl: './possible-matches-page.component.css',
  templateUrl: './possible-matches-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PossibleMatchesPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly pet = computed(() => this.workspace.findLostPet(this.route.snapshot.paramMap.get('id')));
  readonly levelOptions: ('All' | MatchLevel)[] = ['All', 'Strong', 'High', 'Medium', 'Low'];
  readonly uiState = signal<'default' | 'loading' | 'error'>('default');
  level: 'All' | MatchLevel = 'All';

  readonly matches = computed(() => {
    const pet = this.pet();
    return pet
      ? this.workspace
          .matchesForLostPet(pet.id)
          .filter((match) => this.level === 'All' || match.level === this.level)
      : [];
  });

  sighting(id: string) {
    return this.workspace.findSighting(id);
  }
}
