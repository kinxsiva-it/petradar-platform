import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AlertComponent, EmptyStateComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';
import { RescueWorkflowDataSource } from '@petradar/frontend/mock-data';

import { InternalNoteListComponent } from '../../components/internal-note-list/internal-note-list.component.js';
import { RescueCaseTimelineComponent } from '../../components/rescue-case-timeline/rescue-case-timeline.component.js';
import { RescuePhotoUpdateComponent } from '../../components/rescue-photo-update/rescue-photo-update.component.js';
import { RescueSeverityBadgeComponent } from '../../components/rescue-severity-badge/rescue-severity-badge.component.js';
import { RescueStatusBadgeComponent } from '../../components/rescue-status-badge/rescue-status-badge.component.js';
import { RescueStatusStepperComponent } from '../../components/rescue-status-stepper/rescue-status-stepper.component.js';

@Component({
  selector: 'pr-rescue-case-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    InternalNoteListComponent,
    PrivacyBannerComponent,
    RescueCaseTimelineComponent,
    RescuePhotoUpdateComponent,
    RescueSeverityBadgeComponent,
    RescueStatusBadgeComponent,
    RescueStatusStepperComponent,
    RouterLink,
  ],
  styleUrl: './rescue-case-detail-page.component.css',
  templateUrl: './rescue-case-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RescueCaseDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly rescue = inject(RescueWorkflowDataSource);
  readonly uiState = signal<'default' | 'loading' | 'error'>(
    (this.route.snapshot.queryParamMap.get('uiState') as 'default' | 'loading' | 'error') ?? 'default',
  );
  readonly caseItem = computed(() => this.rescue.findCase(this.route.snapshot.paramMap.get('id')));
  readonly selectedPhoto = signal<string | null>(null);

  visiblePhoto(): string | undefined {
    const item = this.caseItem();
    return this.selectedPhoto() ?? item?.photoUrls[0];
  }
}
