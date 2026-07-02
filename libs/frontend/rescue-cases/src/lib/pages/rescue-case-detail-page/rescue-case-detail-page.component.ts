import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, of, Subject, switchMap, tap } from 'rxjs';

import { AuthStateService } from '@petradar/frontend/core';
import {
  AlertComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PrivacyBannerComponent,
} from '@petradar/frontend/shared-ui';

import { InternalNoteListComponent } from '../../components/internal-note-list/internal-note-list.component.js';
import { RescueCaseTimelineComponent } from '../../components/rescue-case-timeline/rescue-case-timeline.component.js';
import { RescueSeverityBadgeComponent } from '../../components/rescue-severity-badge/rescue-severity-badge.component.js';
import { RescueStatusBadgeComponent } from '../../components/rescue-status-badge/rescue-status-badge.component.js';
import { RescueStatusStepperComponent } from '../../components/rescue-status-stepper/rescue-status-stepper.component.js';
import {
  availableRescueTransitions,
  toRescueCaseView,
  type RescueCase,
} from '../../data-access/rescue-case-ui.mapper.js';
import type { RescueCaseStatus } from '../../data-access/rescue-cases-api.models.js';
import { RescueCasesApiService } from '../../data-access/rescue-cases-api.service.js';
import {
  RescueVolunteersApiService,
  type RescueVolunteerOption,
} from '../../data-access/rescue-volunteers-api.service.js';

type DetailState = 'default' | 'error' | 'loading' | 'not-found';

@Component({
  selector: 'pr-rescue-case-detail-page',
  standalone: true,
  imports: [
    AlertComponent,
    EmptyStateComponent,
    FormsModule,
    InternalNoteListComponent,
    LoadingSkeletonComponent,
    PrivacyBannerComponent,
    RescueCaseTimelineComponent,
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
  private readonly auth = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rescueCasesApi = inject(RescueCasesApiService);
  private readonly rescueVolunteersApi = inject(RescueVolunteersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly volunteerSearch = new Subject<string>();
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly uiState = signal<DetailState>('loading');
  readonly errorMessage = signal('');
  readonly actionMessage = signal('');
  readonly caseItem = signal<RescueCase | null>(null);
  readonly selectedPhoto = signal<string | null>(null);
  readonly assigning = signal(false);
  readonly volunteerSearchQuery = signal('');
  readonly volunteerSearchLoading = signal(false);
  readonly volunteerSearchError = signal('');
  readonly volunteerOptions = signal<RescueVolunteerOption[]>([]);
  readonly selectedVolunteer = signal<RescueVolunteerOption | null>(null);
  readonly updating = signal(false);
  readonly statusNote = signal('');
  readonly isAdmin = computed(() => this.auth.isAdmin());
  readonly listRoute = computed(() =>
    this.router.url.startsWith('/volunteer/') ? '/volunteer/rescue-cases' : '/rescue-cases',
  );

  constructor() {
    this.volunteerSearch
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap((query) => {
          this.volunteerSearchError.set('');
          this.volunteerSearchLoading.set(query.trim().length >= 2);
        }),
        switchMap((query) => {
          const searchQuery = query.trim();
          if (searchQuery.length < 2) {
            return of([]);
          }
          return this.rescueVolunteersApi.search(searchQuery).pipe(
            catchError(() => {
              this.volunteerSearchError.set('Volunteer search failed.');
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        this.volunteerOptions.set(items);
        this.volunteerSearchLoading.set(false);
      });
    void this.loadCase();
  }

  visiblePhoto(): string | undefined {
    const item = this.caseItem();
    return this.selectedPhoto() ?? item?.photoUrls[0];
  }

  availableTransitions(status: RescueCaseStatus) {
    return availableRescueTransitions(status);
  }

  async loadCase(): Promise<void> {
    if (!this.id) {
      this.uiState.set('not-found');
      return;
    }
    this.uiState.set('loading');
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.rescueCasesApi.detail(this.id));
      this.caseItem.set(toRescueCaseView(response));
      this.uiState.set('default');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
      this.uiState.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
    }
  }

  async updateStatus(status: RescueCaseStatus): Promise<void> {
    const item = this.caseItem();
    if (!item || this.updating()) {
      return;
    }
    this.updating.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      const response = await firstValueFrom(
        this.rescueCasesApi.updateStatus(item.id, {
          note: this.statusNote().trim() || undefined,
          status,
        }),
      );
      this.caseItem.set(toRescueCaseView(response));
      this.statusNote.set('');
      this.actionMessage.set('Rescue status updated.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.updating.set(false);
    }
  }

  async addInternalNote(body: string): Promise<void> {
    const item = this.caseItem();
    if (!item) {
      return;
    }
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      const response = await firstValueFrom(this.rescueCasesApi.addInternalNote(item.id, { body }));
      this.caseItem.set(toRescueCaseView(response));
      this.actionMessage.set('Internal note added.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    }
  }

  async assignVolunteer(): Promise<void> {
    const item = this.caseItem();
    const volunteer = this.selectedVolunteer();
    if (!item || !volunteer || this.assigning()) {
      return;
    }
    this.assigning.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    try {
      const response = await firstValueFrom(
        this.rescueCasesApi.assignVolunteer(item.id, { volunteerId: volunteer.id }),
      );
      this.caseItem.set(toRescueCaseView(response));
      this.actionMessage.set('Volunteer assigned.');
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.assigning.set(false);
    }
  }

  searchVolunteers(query: string): void {
    this.volunteerSearchQuery.set(query);
    this.selectedVolunteer.set(null);
    this.volunteerSearchError.set('');
    this.volunteerSearch.next(query);
  }

  selectVolunteer(volunteer: RescueVolunteerOption): void {
    this.selectedVolunteer.set(volunteer);
    this.volunteerSearchQuery.set(`${volunteer.displayName} <${volunteer.email}>`);
    this.volunteerOptions.set([]);
  }
}

function toUserMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Rescue case could not be loaded.';
  }
  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Rescue case data could not be loaded.';
  }
  if (error.status === 403) {
    return 'You do not have permission to access this rescue case.';
  }
  if (error.status === 404) {
    return 'Rescue case not found.';
  }
  if (error.status === 409) {
    return 'That rescue case action is not allowed from the current state.';
  }

  const body = error.error as { message?: string | string[] } | null;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return 'Rescue case could not be loaded.';
}
