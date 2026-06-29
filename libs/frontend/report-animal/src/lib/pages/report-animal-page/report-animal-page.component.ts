import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AlertComponent, PrivacyBannerComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';
import {
  AnimalSpecies,
  CollarStatus,
  ReportAnimalSubmission,
  UrgencyLevel,
  UserReport,
  UserWorkspaceDataSource,
} from '@petradar/frontend/mock-data';

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

interface ConditionOption {
  label: ReportCondition;
  description: string;
  urgent: boolean;
}

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
  private readonly workspace = inject(UserWorkspaceDataSource);
  private readonly objectUrls = new Set<string>();
  private exactLocation = { latitude: 13.7563, longitude: 100.5018 };

  readonly currentStep = signal(0);
  readonly uploadError = signal('');
  readonly uploadProgress = signal(0);
  readonly permissionDenied = signal(false);
  readonly mapUnavailable = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly submittedReport = signal<UserReport | null>(null);

  readonly steps = ['Animal', 'Condition', 'Details', 'Photos', 'Location', 'Review'];
  readonly speciesOptions: AnimalSpecies[] = ['Dog', 'Cat', 'Other'];
  readonly conditionOptions: ConditionOption[] = [
    { description: 'Healthy stray or roaming animal.', label: 'Normal stray', urgent: false },
    { description: 'Visible wound, limping, or bleeding.', label: 'Injured', urgent: true },
    { description: 'Weak, coughing, or showing illness.', label: 'Sick', urgent: true },
    { description: 'May need careful monitoring.', label: 'Pregnant', urgent: false },
    { description: 'Young animals without a guardian nearby.', label: 'Newborn litter', urgent: true },
    { description: 'Do not approach. Keep distance.', label: 'Aggressive', urgent: true },
    { description: 'Looks owned or recently displaced.', label: 'Possible lost pet', urgent: false },
  ];
  readonly collarOptions: CollarStatus[] = ['No collar', 'Red collar with bell', 'Blue collar', 'Unknown'];
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
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  simulateUploadFailure(): void {
    this.uploadError.set('Upload failed presentation: try a different image file.');
    this.uploadProgress.set(0);
  }

  useCurrentLocation(): void {
    this.permissionDenied.set(true);
  }

  dropPinManually(): void {
    this.permissionDenied.set(false);
    this.mapUnavailable.set(false);
    this.exactLocation = { latitude: this.exactLocation.latitude + 0.001, longitude: this.exactLocation.longitude + 0.001 };
    this.approximateLocationLabel = 'Near Ari, Bangkok';
  }

  showMapUnavailable(): void {
    this.mapUnavailable.set(true);
  }

  submit(): void {
    this.submitting.set(true);
    this.submitError.set('');
    window.setTimeout(() => {
      const submission: ReportAnimalSubmission = {
        animalCount: this.animalCount,
        approximateLocationLabel: this.approximateLocationLabel,
        collarStatus: this.collarStatus,
        color: this.color,
        condition: this.condition,
        description: this.description,
        photoUrls: this.photoUrls,
        publicRadiusMeters: this.publicRadiusMeters,
        seenDate: this.seenDate,
        seenTime: this.seenTime,
        species: this.species,
        urgency: this.urgency,
        pattern: this.pattern,
      };
      this.submittedReport.set(this.workspace.addReport(submission));
      this.submitting.set(false);
    }, 450);
  }

  private processFiles(files: File[]): void {
    this.uploadError.set('');
    const accepted = files.filter((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.uploadError.set('Only JPG, PNG, or WebP images are accepted in this mock UI.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError.set('Each mock photo must be 10MB or smaller.');
        return false;
      }
      return true;
    });
    if (accepted.length === 0) {
      return;
    }
    for (const file of accepted.slice(0, Math.max(0, 6 - this.photoUrls.length))) {
      const url = URL.createObjectURL(file);
      this.objectUrls.add(url);
      this.photoUrls = [...this.photoUrls, url];
    }
    this.uploadProgress.set(100);
  }
}
