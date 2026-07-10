import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  PrivateLocationPickerComponent,
  type PrivateLocationSelection,
} from '@petradar/frontend/map';
import { AlertComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';
import {
  LostPetsApiService,
  toAuthorizedLostPetView,
  toCreateLostPetRequest,
  toLostPetView,
  toUserMessage,
  type ApiAnimalSpecies,
  type ApiLostPetSex,
  type CreateLostPetRequest,
  type LostPetView,
  type UpdateLostPetRequest,
} from '../../data-access/index.js';

type ContactPreference = 'Email' | 'Phone' | 'In-app message';
type OptionalApiAnimalSpecies = ApiAnimalSpecies | '';

const coordinatePrecision = 6;
const initialLocation: { latitude: number; longitude: number } = {
  latitude: 13.7563,
  longitude: 100.5018,
};
const validSpecies = new Set<OptionalApiAnimalSpecies>(['CAT', 'DOG', 'OTHER']);

@Component({
  selector: 'pr-create-lost-pet-page',
  standalone: true,
  imports: [
    AlertComponent,
    CommonModule,
    FormsModule,
    PrivacyBannerComponent,
    PrivateLocationPickerComponent,
    RouterLink,
  ],
  styleUrl: './create-lost-pet-page.component.css',
  templateUrl: './create-lost-pet-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLostPetPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lostPetsApi = inject(LostPetsApiService);
  private readonly editingId = this.route.snapshot.paramMap.get('id');

  readonly step = signal(0);
  readonly submittedPet = signal<LostPetView | null>(null);
  readonly uploadError = signal('');
  readonly submitError = signal('');
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly editMode = signal(this.editingId !== null);
  readonly locationSelected = signal(false);
  readonly steps = ['Identity', 'Appearance', 'Photos', 'Location', 'Contact', 'Review'];

  selectedLocationLabel(): string {
    return coordinateLabel(this.latitude, this.longitude);
  }

  readonly speciesOptions: { label: string; value: ApiAnimalSpecies }[] = [
    { label: 'Cat', value: 'CAT' },
    { label: 'Dog', value: 'DOG' },
    { label: 'Other', value: 'OTHER' },
  ];
  readonly sexOptions: { label: string; value: ApiLostPetSex }[] = [
    { label: 'Unknown', value: 'UNKNOWN' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Male', value: 'MALE' },
  ];
  readonly contactOptions: ContactPreference[] = ['Email', 'Phone', 'In-app message'];

  petName = '';
  species: OptionalApiAnimalSpecies = '';
  breed = '';
  sex: ApiLostPetSex = 'UNKNOWN';
  ageDescription = '';
  color = '';
  pattern = '';
  collarDescription = '';
  microchipped = false;
  description = '';
  photoUrls: string[] = [];
  photoUrlDraft = '';
  approximateLastSeenLabel = 'Choose a private last-seen pin';
  latitude = initialLocation.latitude;
  longitude = initialLocation.longitude;
  lastSeenAt = '';
  contactPreference: ContactPreference = 'In-app message';
  contactDetail = '';
  rewardCents: number | null = null;

  constructor() {
    if (this.editingId) {
      void this.loadEditablePet(this.editingId);
    }
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

  addPhotoUrl(): void {
    this.uploadError.set('');
    const value = this.photoUrlDraft.trim();
    if (!value) {
      return;
    }
    if (this.photoUrls.length >= 5) {
      this.uploadError.set('Lost-pet posts accept at most 5 photo URLs.');
      return;
    }
    if (!/^https?:\/\//i.test(value)) {
      this.uploadError.set('Use a server-hosted image URL that starts with http:// or https://.');
      return;
    }
    this.photoUrls = [...this.photoUrls, value];
    this.photoUrlDraft = '';
  }

  removePhoto(url: string): void {
    this.photoUrls = this.photoUrls.filter((item) => item !== url);
  }

  useCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.submitError.set('');
        this.setExactLocation(
          position.coords.latitude,
          position.coords.longitude,
          'Current location',
        );
      },
      () => {
        this.submitError.set(
          'Current location is unavailable. Select a point on the map or enter coordinates.',
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  moveSelectedLocation(latitudeDelta: number, longitudeDelta: number): void {
    this.setExactLocation(
      this.latitude + latitudeDelta,
      this.longitude + longitudeDelta,
      'Selected private pin',
    );
  }

  selectPrivateLocation(selection: PrivateLocationSelection): void {
    this.submitError.set('');
    this.setExactLocation(selection.latitude, selection.longitude, selection.label);
  }

  async submit(): Promise<void> {
    if (this.submitting() || this.loading()) {
      return;
    }

    this.submitAttempted.set(true);
    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.submitError.set(validationMessage);
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');
    try {
      const lastSeenAt = this.validLastSeenAt();
      if (!lastSeenAt) {
        this.submitError.set('Enter a valid last-seen date and time.');
        return;
      }

      const saved = this.editingId
        ? await firstValueFrom(
            this.lostPetsApi.updateLostPet(this.editingId, this.buildUpdatePayload(lastSeenAt)),
          )
        : await firstValueFrom(this.lostPetsApi.createLostPet(this.buildCreatePayload(lastSeenAt)));
      const view = toLostPetView(saved);
      this.submittedPet.set(view);
      await this.router.navigateByUrl(`/lost-pets/${view.id}`);
    } catch (error) {
      this.submitError.set(
        toUserMessage(error, 'Lost-pet post could not be saved. Please try again.'),
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private async loadEditablePet(id: string): Promise<void> {
    this.loading.set(true);
    this.submitError.set('');
    try {
      const pet = toAuthorizedLostPetView(await firstValueFrom(this.lostPetsApi.getMyLostPet(id)));
      this.petName = pet.petName;
      this.species = pet.speciesValue;
      this.breed = pet.breed ?? '';
      this.sex = pet.sexValue;
      this.ageDescription = pet.ageDescription ?? '';
      this.color = pet.color ?? '';
      this.pattern = pet.pattern ?? '';
      this.collarDescription = pet.collarDescription ?? '';
      this.microchipped = pet.microchipped ?? false;
      this.description = pet.description ?? '';
      this.photoUrls = [...pet.photoUrls].filter((url) => !url.startsWith('data:image/svg+xml'));
      this.lastSeenAt = pet.lastSeenInputValue;
      this.contactDetail = pet.contactMethod ?? '';
      this.rewardCents = pet.rewardCents;
      this.latitude = pet.exactLocation?.latitude ?? pet.approximateLastSeenLocation.latitude;
      this.longitude = pet.exactLocation?.longitude ?? pet.approximateLastSeenLocation.longitude;
      this.approximateLastSeenLabel = pet.approximateLastSeenLabel;
      this.locationSelected.set(true);
    } catch (error) {
      this.submitError.set(toEditLoadMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private buildCreatePayload(lastSeenAt: string): CreateLostPetRequest {
    return toCreateLostPetRequest({
      age: this.ageDescription,
      breed: this.breed,
      collarDescription: this.collarDescription,
      color: this.color,
      contactMethod: this.contactSummary(),
      description: this.description,
      lastSeenAt,
      latitude: this.latitude,
      longitude: this.longitude,
      microchipped: this.microchipped,
      name: this.petName,
      pattern: this.pattern,
      photoUrls: this.photoUrls,
      rewardCents: this.rewardCents ?? undefined,
      sex: this.sex,
      species: this.requireSpecies(),
    });
  }

  private buildUpdatePayload(lastSeenAt: string): UpdateLostPetRequest {
    return {
      ...toCreateLostPetRequest({
        age: this.ageDescription,
        breed: this.breed,
        collarDescription: this.collarDescription,
        color: this.color,
        contactMethod: this.contactSummary(),
        description: this.description,
        lastSeenAt,
        latitude: this.latitude,
        longitude: this.longitude,
        microchipped: this.microchipped,
        name: this.petName,
        pattern: this.pattern,
        photoUrls: this.photoUrls,
        rewardCents: this.rewardCents ?? undefined,
        sex: this.sex,
        species: this.requireSpecies(),
      }),
    };
  }

  private contactSummary(): string | undefined {
    const detail = this.contactDetail.trim();
    if (!detail) return undefined;
    return `${this.contactPreference}: ${detail}`;
  }

  private setExactLocation(latitude: number, longitude: number, label: string): void {
    this.latitude = roundCoordinate(Math.max(-90, Math.min(90, latitude)));
    this.longitude = roundCoordinate(Math.max(-180, Math.min(180, longitude)));
    this.approximateLastSeenLabel = label;
    this.locationSelected.set(true);
  }

  private validateForm(): string {
    if (!this.petName.trim()) return 'Enter the pet name.';
    if (!validSpecies.has(this.species)) return 'Choose the closest animal type.';
    if (!this.validLastSeenAt()) {
      return 'Enter a valid last-seen date and time.';
    }
    if (!this.locationSelected()) {
      return 'Choose or confirm the exact private last-seen pin.';
    }
    if (this.latitude < -90 || this.latitude > 90) {
      return 'Latitude must be between -90 and 90.';
    }
    if (this.longitude < -180 || this.longitude > 180) {
      return 'Longitude must be between -180 and 180.';
    }
    if (this.rewardCents !== null && (!Number.isFinite(this.rewardCents) || this.rewardCents < 0)) {
      return 'Reward must be zero or greater.';
    }
    return '';
  }

  private validLastSeenAt(): string | null {
    if (!this.lastSeenAt) {
      return null;
    }
    const date = new Date(this.lastSeenAt);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private requireSpecies(): ApiAnimalSpecies {
    if (this.species === 'CAT' || this.species === 'DOG' || this.species === 'OTHER') {
      return this.species;
    }
    throw new Error('A valid species is required before saving a lost-pet post.');
  }
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(coordinatePrecision));
}

function coordinateLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function toEditLoadMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'Lost pet not found.';
  }
  return toUserMessage(error, 'Editable lost-pet details could not be loaded.');
}
