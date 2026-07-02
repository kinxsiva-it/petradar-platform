import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  AlertComponent,
  PrivacyBannerComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';
import { SightingsApiService, toCreateSightingRequest } from '@petradar/frontend/sightings';

import { ReportStepperComponent } from '../../components/report-stepper/report-stepper.component.js';
import { ReportSuccessComponent } from '../../components/report-success/report-success.component.js';

type ReportCondition =
  | 'Normal stray'
  | 'Injured'
  | 'Sick'
  | 'Pregnant'
  | 'Newborn litter'
  | 'Aggressive'
  | 'Possible lost pet';
type AnimalSpecies = 'Cat' | 'Dog' | 'Other';
type CollarStatus = 'Blue collar' | 'No collar' | 'Red collar with bell' | 'Unknown';
type UrgencyLevel = 'Emergency' | 'High' | 'Low' | 'Medium';

interface ConditionOption {
  label: ReportCondition;
  description: string;
  urgent: boolean;
}

interface SelectedPhoto {
  file: File;
  url: string;
}

const acceptedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxPhotoBytes = 8 * 1024 * 1024;
const maxPhotos = 5;

@Component({
  selector: 'pr-report-animal-page',
  standalone: true,
  imports: [
    AlertComponent,
    CommonModule,
    FormsModule,
    PrivacyBannerComponent,
    ReportStepperComponent,
    ReportSuccessComponent,
    StatusBadgeComponent,
  ],
  styleUrl: './report-animal-page.component.css',
  templateUrl: './report-animal-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportAnimalPageComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly sightingsApi = inject(SightingsApiService);
  private readonly objectUrls = new Set<string>();
  private exactLocation = { latitude: 13.7563, longitude: 100.5018 };

  readonly currentStep = signal(0);
  readonly uploadError = signal('');
  readonly uploadProgress = signal(0);
  readonly permissionDenied = signal(false);
  readonly mapUnavailable = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly submittedReference = signal<string | null>(null);
  private createdSightingId: string | null = null;
  private selectedPhotos: SelectedPhoto[] = [];

  readonly steps = ['Animal', 'Condition', 'Details', 'Photos', 'Location', 'Review'];
  readonly speciesOptions: AnimalSpecies[] = ['Dog', 'Cat', 'Other'];
  readonly conditionOptions: ConditionOption[] = [
    { description: 'Healthy stray or roaming animal.', label: 'Normal stray', urgent: false },
    { description: 'Visible wound, limping, or bleeding.', label: 'Injured', urgent: true },
    { description: 'Weak, coughing, or showing illness.', label: 'Sick', urgent: true },
    { description: 'May need careful monitoring.', label: 'Pregnant', urgent: false },
    {
      description: 'Young animals without a guardian nearby.',
      label: 'Newborn litter',
      urgent: true,
    },
    { description: 'Do not approach. Keep distance.', label: 'Aggressive', urgent: true },
    {
      description: 'Looks owned or recently displaced.',
      label: 'Possible lost pet',
      urgent: false,
    },
  ];
  readonly collarOptions: CollarStatus[] = [
    'No collar',
    'Red collar with bell',
    'Blue collar',
    'Unknown',
  ];
  readonly urgencyOptions: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Emergency'];
  readonly radiusOptions = [200, 300, 500, 800];

  species: AnimalSpecies = 'Dog';
  animalCount = 1;
  condition: ReportCondition = 'Normal stray';
  color = 'White';
  pattern = 'Solid white';
  collarStatus: CollarStatus = 'No collar';
  description = 'White dog limping near the roadside. Appears tired and may need attention.';
  seenDate = 'May 20, 2025';
  seenTime = '10:38 AM';
  urgency: UrgencyLevel = 'Medium';
  photoUrls: string[] = [];
  approximateLocationLabel = 'Ari, Bangkok';
  publicRadiusMeters = 300;

  readonly currentTitle = computed(() => this.steps[this.currentStep()] ?? 'Report');

  ngOnDestroy(): void {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
  }

  goToStep(index: number): void {
    if (index <= this.currentStep()) {
      this.currentStep.set(index);
    }
  }

  next(): void {
    this.submitError.set('');
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((step) => step + 1);
    }
  }

  back(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
  }

  addFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  dropFiles(event: DragEvent): void {
    event.preventDefault();
    this.processFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  removePhoto(url: string): void {
    this.photoUrls = this.photoUrls.filter((item) => item !== url);
    this.selectedPhotos = this.selectedPhotos.filter((item) => item.url !== url);
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  useCurrentLocation(): void {
    this.permissionDenied.set(true);
  }

  dropPinManually(): void {
    this.permissionDenied.set(false);
    this.mapUnavailable.set(false);
    this.exactLocation = {
      latitude: this.exactLocation.latitude + 0.001,
      longitude: this.exactLocation.longitude + 0.001,
    };
    this.approximateLocationLabel = 'Near Ari, Bangkok';
  }

  showMapUnavailable(): void {
    this.mapUnavailable.set(true);
  }

  async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    const seenAt = this.parseSeenAt();
    if (!seenAt) {
      this.submitError.set('Enter a valid seen date and time before submitting.');
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');
    this.uploadError.set('');
    try {
      if (!this.createdSightingId) {
        const request = toCreateSightingRequest({
          animalCount: this.animalCount,
          collarStatus: this.collarStatus,
          color: this.color,
          condition: this.condition,
          description: this.description,
          latitude: this.exactLocation.latitude,
          longitude: this.exactLocation.longitude,
          pattern: this.pattern,
          seenAt: seenAt.toISOString(),
          species: this.species,
          urgency: this.urgency,
        });
        const created = await firstValueFrom(this.sightingsApi.create(request));
        this.createdSightingId = created.id;
        this.submittedReference.set(created.id);
      }

      if (this.selectedPhotos.length > 0) {
        this.uploadProgress.set(35);
        await firstValueFrom(
          this.sightingsApi.uploadPhotos(
            this.createdSightingId,
            this.selectedPhotos.map((photo) => photo.file),
          ),
        );
        this.uploadProgress.set(100);
      }

      await this.router.navigateByUrl('/my/reports');
    } catch (error) {
      if (this.createdSightingId) {
        this.uploadError.set(
          `${toSubmitMessage(error)} Your sighting was saved; retry photo upload before leaving this page.`,
        );
      } else {
        this.submitError.set(toSubmitMessage(error));
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private processFiles(files: File[]): void {
    this.uploadError.set('');
    this.uploadProgress.set(0);
    const availableSlots = maxPhotos - this.selectedPhotos.length;
    if (availableSlots <= 0) {
      this.uploadError.set('A sighting can have at most 5 photos.');
      return;
    }

    const accepted = files.filter((file) => {
      if (!acceptedPhotoTypes.includes(file.type)) {
        this.uploadError.set('Only JPG, PNG, or WebP images are accepted.');
        return false;
      }
      if (file.size <= 0) {
        this.uploadError.set('Empty image files are not accepted.');
        return false;
      }
      if (file.size > maxPhotoBytes) {
        this.uploadError.set('Each photo must be 8 MB or smaller.');
        return false;
      }
      return true;
    });
    if (accepted.length === 0) {
      return;
    }
    if (accepted.length > availableSlots) {
      this.uploadError.set('A sighting can have at most 5 photos.');
    }

    for (const file of accepted.slice(0, availableSlots)) {
      const url = URL.createObjectURL(file);
      this.objectUrls.add(url);
      this.selectedPhotos = [...this.selectedPhotos, { file, url }];
      this.photoUrls = [...this.photoUrls, url];
    }
  }

  private parseSeenAt(): Date | null {
    const date = new Date(`${this.seenDate} ${this.seenTime}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

function toSubmitMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'The report could not be submitted. Please try again.';
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }

  const body = error.error as { message?: string | string[] } | null;
  const message = body?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Check the report details and try again.';
}
