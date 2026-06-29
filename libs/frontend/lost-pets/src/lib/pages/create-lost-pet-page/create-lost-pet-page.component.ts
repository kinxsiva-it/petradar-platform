import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PrivacyBannerComponent } from '@petradar/frontend/shared-ui';
import {
  AnimalSpecies,
  ContactPreference,
  LostPetSubmission,
  UserLostPet,
  UserWorkspaceDataSource,
} from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-create-lost-pet-page',
  standalone: true,
  imports: [CommonModule, FormsModule, PrivacyBannerComponent, RouterLink],
  styleUrl: './create-lost-pet-page.component.css',
  templateUrl: './create-lost-pet-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLostPetPageComponent implements OnDestroy {
  private readonly workspace = inject(UserWorkspaceDataSource);
  private readonly objectUrls = new Set<string>();
  private exactLastSeen = { latitude: 13.7563, longitude: 100.5018 };

  readonly step = signal(0);
  readonly submittedPet = signal<UserLostPet | null>(null);
  readonly uploadError = signal('');
  readonly steps = ['Identity', 'Appearance', 'Photos', 'Location', 'Contact', 'Review'];

  readonly speciesOptions: AnimalSpecies[] = ['Cat', 'Dog', 'Other'];
  readonly contactOptions: ContactPreference[] = ['Email', 'Phone', 'In-app message'];

  petName = 'Milo';
  species: AnimalSpecies = 'Cat';
  breed = 'Domestic Shorthair';
  sex = 'Male';
  ageDescription = '2 years';
  color = 'Orange';
  pattern = 'Tabby';
  collarDescription = 'Red collar with silver bell';
  microchipLabel = 'Yes, microchipped';
  description = 'Friendly but shy. Please do not chase.';
  photoUrls: string[] = [];
  approximateLastSeenLabel = 'Near Ari, Bangkok';
  lastSeenDate = 'May 20, 2025';
  lastSeenTime = '8:30 PM';
  contactPreference: ContactPreference = 'Email';
  contactDetail = 'nicha.owner@example.com';
  rewardLabel = 'Reward offered';
  hideContactPublicly = true;

  ngOnDestroy(): void {
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
  }

  next(): void {
    this.step.update((value) => Math.min(this.steps.length - 1, value + 1));
  }

  back(): void {
    this.step.update((value) => Math.max(0, value - 1));
  }

  go(index: number): void {
    if (index <= this.step()) this.step.set(index);
  }

  addFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.uploadError.set('');
    for (const file of files.slice(0, Math.max(0, 8 - this.photoUrls.length))) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        this.uploadError.set('Only JPG, PNG, or WebP images are accepted.');
        continue;
      }
      const url = URL.createObjectURL(file);
      this.objectUrls.add(url);
      this.photoUrls = [...this.photoUrls, url];
    }
    input.value = '';
  }

  removePhoto(url: string): void {
    this.photoUrls = this.photoUrls.filter((item) => item !== url);
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  useCurrentLocation(): void {
    this.exactLastSeen = { latitude: this.exactLastSeen.latitude + 0.001, longitude: this.exactLastSeen.longitude };
    this.approximateLastSeenLabel = 'Near Ari, Bangkok';
  }

  submit(): void {
    const submission: LostPetSubmission = {
      ageDescription: this.ageDescription,
      approximateLastSeenLabel: this.approximateLastSeenLabel,
      breed: this.breed,
      collarDescription: this.collarDescription,
      color: this.color,
      contactDetail: this.contactDetail,
      contactPreference: this.contactPreference,
      description: this.description,
      hideContactPublicly: this.hideContactPublicly,
      lastSeenDate: this.lastSeenDate,
      lastSeenTime: this.lastSeenTime,
      microchipLabel: this.microchipLabel,
      pattern: this.pattern,
      petName: this.petName,
      photoUrls: this.photoUrls,
      rewardLabel: this.rewardLabel,
      sex: this.sex,
      species: this.species,
    };
    this.submittedPet.set(this.workspace.addLostPet(submission));
  }
}
