import { Injectable, computed, signal } from '@angular/core';

import {
  publicLostPetsFixture,
  publicSightingsFixture,
} from '../fixtures/public-discovery.fixture.js';
import type {
  AnimalSpecies,
  DiscoveryFilters,
  PublicLostPet,
  PublicSighting,
} from '../models/public-discovery.model.js';

const defaultSightingFilters: DiscoveryFilters = {
  condition: 'All',
  query: '',
  species: 'All',
  status: 'All',
  verification: 'All',
};

const defaultLostPetFilters: DiscoveryFilters = {
  condition: 'All',
  query: '',
  species: 'All',
  status: 'All',
  verification: 'All',
};

@Injectable({ providedIn: 'root' })
export class PublicDiscoveryDataSource {
  private readonly sightingFilters = signal<DiscoveryFilters>({ ...defaultSightingFilters });
  private readonly lostPetFilters = signal<DiscoveryFilters>({ ...defaultLostPetFilters });
  private readonly selectedSightingId = signal<string | null>(null);

  readonly sightings = signal<PublicSighting[]>(publicSightingsFixture);
  readonly lostPets = signal<PublicLostPet[]>(publicLostPetsFixture);
  readonly selectedSighting = computed(() => this.findSighting(this.selectedSightingId()));
  readonly currentSightingFilters = computed(() => this.sightingFilters());
  readonly currentLostPetFilters = computed(() => this.lostPetFilters());

  readonly filteredSightings = computed(() => {
    const filters = this.sightingFilters();
    return this.sightings().filter((sighting) => {
      const queryTarget = `${sighting.reference} ${sighting.title} ${sighting.approximateLocation.label} ${sighting.color}`.toLowerCase();
      const matchesQuery = queryTarget.includes(filters.query.trim().toLowerCase());
      const matchesSpecies = filters.species === 'All' || sighting.species === filters.species;
      const matchesCondition =
        filters.condition === 'All' || sighting.condition === filters.condition;
      const matchesStatus = filters.status === 'All' || sighting.status === filters.status;
      const matchesVerification =
        filters.verification === 'All' || sighting.verificationStatus === filters.verification;
      return matchesQuery && matchesSpecies && matchesCondition && matchesStatus && matchesVerification;
    });
  });

  readonly filteredLostPets = computed(() => {
    const filters = this.lostPetFilters();
    return this.lostPets().filter((pet) => {
      const queryTarget = `${pet.reference} ${pet.petName} ${pet.breed ?? ''} ${pet.approximateLastSeenLocation.label} ${pet.color}`.toLowerCase();
      const matchesQuery = queryTarget.includes(filters.query.trim().toLowerCase());
      const matchesSpecies = filters.species === 'All' || pet.species === filters.species;
      const matchesStatus = filters.status === 'All' || pet.status === filters.status;
      return matchesQuery && matchesSpecies && matchesStatus;
    });
  });

  setSelectedSighting(id: string): void {
    this.selectedSightingId.set(id);
  }

  clearSelectedSighting(): void {
    this.selectedSightingId.set(null);
  }

  updateSightingFilter<K extends keyof DiscoveryFilters>(
    key: K,
    value: DiscoveryFilters[K],
  ): void {
    this.sightingFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  updateLostPetFilter<K extends keyof DiscoveryFilters>(
    key: K,
    value: DiscoveryFilters[K],
  ): void {
    this.lostPetFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearSightingFilters(): void {
    this.sightingFilters.set({ ...defaultSightingFilters });
  }

  clearLostPetFilters(): void {
    this.lostPetFilters.set({ ...defaultLostPetFilters });
  }

  findSighting(id: string | null): PublicSighting | undefined {
    return this.sightings().find((sighting) => sighting.id === id || sighting.reference === id);
  }

  findLostPet(id: string | null): PublicLostPet | undefined {
    return this.lostPets().find((pet) => pet.id === id || pet.reference === id);
  }

  relatedSightings(currentId: string, species?: AnimalSpecies): PublicSighting[] {
    return this.sightings()
      .filter((sighting) => sighting.id !== currentId)
      .filter((sighting) => !species || sighting.species === species)
      .slice(0, 3);
  }
}
