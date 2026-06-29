import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EmptyStateComponent, PrivacyBannerComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import { UserWorkspaceDataSource } from '@petradar/frontend/mock-data';

import { MatchScoreRingComponent } from '../../components/match-score-ring/match-score-ring.component.js';

@Component({
  selector: 'pr-match-detail-page',
  standalone: true,
  imports: [EmptyStateComponent, MatchScoreRingComponent, PrivacyBannerComponent, RouterLink, StatusBadgeComponent],
  styleUrl: './match-detail-page.component.css',
  templateUrl: './match-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly workspace = inject(UserWorkspaceDataSource);
  readonly detail = computed(() => this.workspace.findMatchDetail(this.route.snapshot.paramMap.get('id')));
}
