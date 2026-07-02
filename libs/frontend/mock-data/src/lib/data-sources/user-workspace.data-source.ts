import { Injectable, computed, signal } from '@angular/core';

import { publicSightingsFixture } from '../fixtures/public-discovery.fixture.js';
import {
  currentUserFixture,
  matchResultsFixture,
  notificationsFixture,
  userLostPetsFixture,
  userReportsFixture,
  userSettingsFixture,
} from '../fixtures/user-workspace.fixture.js';
import type { LostPetStatus, PublicSighting } from '../models/public-discovery.model.js';
import type {
  CurrentUserProfile,
  LostPetSubmission,
  MatchDetailView,
  MatchResult,
  ReportAnimalSubmission,
  UserLostPet,
  UserNotification,
  UserReport,
  UserReportStatus,
  UserSettings,
} from '../models/user-workspace.model.js';

function nextReference(prefix: string, count: number): string {
  return `${prefix}-${String(count + 21).padStart(5, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class UserWorkspaceDataSource {
  readonly currentUser = signal<CurrentUserProfile>({ ...currentUserFixture });
  readonly userReports = signal<UserReport[]>([...userReportsFixture]);
  readonly userLostPets = signal<UserLostPet[]>([...userLostPetsFixture]);
  readonly matches = signal<MatchResult[]>([...matchResultsFixture]);
  readonly notifications = signal<UserNotification[]>([...notificationsFixture]);
  readonly settings = signal<UserSettings>({ ...userSettingsFixture });
  readonly toast = signal<string | null>(null);

  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.read).length);
  readonly activeLostPets = computed(() =>
    this.userLostPets().filter((pet) => pet.status === 'Active' || pet.status === 'Possible match'),
  );
  readonly reportSummary = computed(() => ({
    all: this.userReports().length,
    matches: this.userReports().reduce((total, report) => total + report.matchCount, 0),
    pending: this.userReports().filter((report) => report.verificationStatus === 'Pending').length,
    verified: this.userReports().filter((report) => report.verificationStatus === 'Verified').length,
  }));
  readonly lostPetSummary = computed(() => ({
    active: this.activeLostPets().length,
    matches: this.userLostPets().reduce((total, pet) => total + pet.possibleMatchCount, 0),
    reunited: this.userLostPets().filter((pet) => pet.status === 'Reunited').length,
  }));

  addReport(submission: ReportAnimalSubmission): UserReport {
    const report: UserReport = {
      animalCount: submission.animalCount,
      approximateLocationLabel: submission.approximateLocationLabel,
      collarStatus: submission.collarStatus,
      color: submission.color,
      condition: submission.condition,
      description: submission.description,
      editable: true,
      id: `report-${String(Date.now())}`,
      lifecycleStatus: 'Submitted',
      matchCount: 0,
      pattern: submission.pattern,
      photoUrls:
        submission.photoUrls.length > 0
          ? submission.photoUrls
          : ['https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80'],
      publicRadiusMeters: submission.publicRadiusMeters,
      reference: nextReference(submission.species === 'Dog' ? 'DOG' : 'CAT', this.userReports().length),
      seenAt: `${submission.seenDate} at ${submission.seenTime}`,
      species: submission.species,
      title: `${submission.color} ${submission.species.toLowerCase()} report`,
      urgency: submission.urgency,
      verificationStatus: 'Pending',
    };
    this.userReports.update((reports) => [report, ...reports]);
    this.notifications.update((items) => [
      {
        createdAtLabel: 'now',
        description: `${report.reference} was saved locally in the UI prototype and is pending review.`,
        id: `not-${report.id}`,
        kind: 'request-info',
        read: false,
        route: '/my/reports',
        targetLabel: report.reference,
        title: 'Mock report submitted',
      },
      ...items,
    ]);
    return report;
  }

  addLostPet(submission: LostPetSubmission): UserLostPet {
    const pet: UserLostPet = {
      ageDescription: submission.ageDescription,
      approximateLastSeenLabel: submission.approximateLastSeenLabel,
      breed: submission.breed,
      collarDescription: submission.collarDescription,
      color: submission.color,
      contactDetail: submission.contactDetail,
      contactPreference: submission.contactPreference,
      description: submission.description,
      hideContactPublicly: submission.hideContactPublicly,
      id: `lp-${submission.petName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(Date.now())}`,
      lastSeenAt: `${submission.lastSeenDate} at ${submission.lastSeenTime}`,
      microchipLabel: submission.microchipLabel,
      pattern: submission.pattern,
      petName: submission.petName,
      photoUrls:
        submission.photoUrls.length > 0
          ? submission.photoUrls
          : ['https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=80'],
      possibleMatchCount: 0,
      reference: nextReference('LP', this.userLostPets().length),
      rewardLabel: submission.rewardLabel,
      sex: submission.sex,
      species: submission.species,
      status: 'Active',
    };
    this.userLostPets.update((pets) => [pet, ...pets]);
    return pet;
  }

  updateReportStatus(id: string, status: UserReportStatus): void {
    this.userReports.update((reports) =>
      reports.map((report) => (report.id === id ? { ...report, lifecycleStatus: status } : report)),
    );
  }

  updateLostPetStatus(id: string, status: LostPetStatus): void {
    this.userLostPets.update((pets) =>
      pets.map((pet) => (pet.id === id ? { ...pet, status } : pet)),
    );
  }

  updateProfile(profile: CurrentUserProfile): void {
    this.currentUser.set({ ...profile });
    this.showToast('Profile changes saved in mock state.');
  }

  updateSettings(settings: UserSettings): void {
    this.settings.set({ ...settings });
    this.showToast('Settings saved in mock state.');
  }

  resetSettings(): void {
    this.settings.set({ ...userSettingsFixture });
    this.showToast('Mock preferences reset.');
  }

  markNotificationRead(id: string): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  markAllNotificationsRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  requestMatchReview(matchId: string): void {
    this.matches.update((matches) =>
      matches.map((match) => (match.id === matchId ? { ...match, reviewRequested: true } : match)),
    );
    this.showToast('Admin review request recorded in mock state.');
  }

  findLostPet(id: string | null): UserLostPet | undefined {
    return this.userLostPets().find((pet) => pet.id === id || pet.reference === id);
  }

  matchesForLostPet(id: string | null): MatchResult[] {
    return this.matches().filter((match) => match.lostPetId === id);
  }

  findMatchDetail(id: string | null): MatchDetailView | undefined {
    const match = this.matches().find((item) => item.id === id);
    if (!match) {
      return undefined;
    }
    const lostPet = this.findLostPet(match.lostPetId);
    const sighting = this.findSighting(match.sightingId);
    return lostPet && sighting ? { lostPet, match, sighting } : undefined;
  }

  findSighting(id: string): PublicSighting | undefined {
    return publicSightingsFixture.find((sighting) => sighting.id === id || sighting.reference === id);
  }

  showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      this.toast.set(null);
    }, 3200);
  }
}
