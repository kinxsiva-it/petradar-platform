import { Injectable, computed, signal } from '@angular/core';

import {
  adminActivityFixture,
  adminReportsFixture,
  adminUsersFixture,
  adminVolunteersFixture,
  analyticsSnapshotFixture,
  duplicateSuggestionsFixture,
  executiveReportFixture,
  heatmapPointsFixture,
  privacySettingsFixture,
} from '../fixtures/admin-workspace.fixture.js';
import type {
  AdminAccountStatus,
  AdminActivity,
  AdminManagedUser,
  AdminReport,
  AdminReportVerificationState,
  AdminRescueFilters,
  AdminUserFilters,
  AdminUserRole,
  AdminVolunteerCandidate,
  AdminWorkspaceFilters,
  DuplicateSuggestion,
  PrivacySettings,
  VolunteerVerificationState,
} from '../models/admin-workspace.model.js';

const reportFilters: AdminWorkspaceFilters = {
  condition: 'All',
  query: '',
  reporter: 'All',
  species: 'All',
  urgency: 'All',
  verification: 'All',
};

const rescueFilters: AdminRescueFilters = {
  assignment: 'All',
  query: '',
  severity: 'All',
  status: 'All',
  volunteerId: 'All',
};

const userFilters: AdminUserFilters = {
  accountStatus: 'All',
  query: '',
  role: 'All',
  volunteerVerification: 'All',
};

@Injectable({ providedIn: 'root' })
export class AdminWorkspaceDataSource {
  readonly reports = signal<AdminReport[]>(adminReportsFixture);
  readonly duplicateSuggestions = signal<DuplicateSuggestion[]>(duplicateSuggestionsFixture);
  readonly volunteers = signal<AdminVolunteerCandidate[]>(adminVolunteersFixture);
  readonly privacySettings = signal<PrivacySettings>({ ...privacySettingsFixture });
  readonly users = signal<AdminManagedUser[]>(adminUsersFixture);
  readonly activity = signal<AdminActivity[]>(adminActivityFixture);
  readonly toast = signal<string | null>(null);
  readonly reportFilters = signal<AdminWorkspaceFilters>({ ...reportFilters });
  readonly rescueFilters = signal<AdminRescueFilters>({ ...rescueFilters });
  readonly userFilters = signal<AdminUserFilters>({ ...userFilters });
  readonly analyticsSnapshot = signal(analyticsSnapshotFixture);
  readonly heatmapPoints = signal(heatmapPointsFixture);
  readonly executiveReport = signal(executiveReportFixture);

  readonly pendingReports = computed(() =>
    this.reports().filter((item) => item.verification === 'PENDING' || item.verification === 'NEEDS_REVIEW'),
  );
  readonly urgentReports = computed(() =>
    this.pendingReports().filter((item) => item.urgency === 'HIGH' || item.urgency === 'EMERGENCY'),
  );
  readonly openDuplicates = computed(() => this.duplicateSuggestions().filter((item) => item.state === 'OPEN'));
  readonly filteredReports = computed(() => {
    const filters = this.reportFilters();
    return this.pendingReports().filter((item) => {
      const target = `${item.reference} ${item.title} ${item.reporter.name} ${item.location.approximateLabel}`.toLowerCase();
      return (
        target.includes(filters.query.trim().toLowerCase()) &&
        (filters.species === 'All' || item.species === filters.species) &&
        (filters.urgency === 'All' || item.urgency === filters.urgency) &&
        (filters.verification === 'All' || item.verification === filters.verification) &&
        (filters.condition === 'All' || item.condition === filters.condition) &&
        (filters.reporter === 'All' || item.reporter.name === filters.reporter)
      );
    });
  });
  readonly filteredUsers = computed(() => {
    const filters = this.userFilters();
    return this.users().filter((item) => {
      const target = `${item.name} ${item.email} ${item.phone} ${item.locationLabel}`.toLowerCase();
      return (
        target.includes(filters.query.trim().toLowerCase()) &&
        (filters.role === 'All' || item.roles.includes(filters.role)) &&
        (filters.accountStatus === 'All' || item.accountStatus === filters.accountStatus) &&
        (filters.volunteerVerification === 'All' || item.volunteerVerification === filters.volunteerVerification)
      );
    });
  });

  updateReportFilter<K extends keyof AdminWorkspaceFilters>(key: K, value: AdminWorkspaceFilters[K]): void {
    this.reportFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearReportFilters(): void {
    this.reportFilters.set({ ...reportFilters });
  }

  updateRescueFilter<K extends keyof AdminRescueFilters>(key: K, value: AdminRescueFilters[K]): void {
    this.rescueFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearRescueFilters(): void {
    this.rescueFilters.set({ ...rescueFilters });
  }

  updateUserFilter<K extends keyof AdminUserFilters>(key: K, value: AdminUserFilters[K]): void {
    this.userFilters.update((filters) => ({ ...filters, [key]: value }));
  }

  clearUserFilters(): void {
    this.userFilters.set({ ...userFilters });
  }

  findReport(id: string | null): AdminReport | undefined {
    return this.reports().find((item) => item.id === id || item.reference === id);
  }

  findDuplicate(id: string | null): DuplicateSuggestion | undefined {
    return this.duplicateSuggestions().find((item) => item.id === id);
  }

  findUser(id: string | null): AdminManagedUser | undefined {
    return this.users().find((item) => item.id === id);
  }

  findVolunteer(id: string | null): AdminVolunteerCandidate | undefined {
    return this.volunteers().find((item) => item.id === id);
  }

  approveReport(id: string, note = ''): void {
    this.updateReportVerification(id, 'VERIFIED', 'Report approved in mock state.', note);
    this.addActivity('REPORT_APPROVED', id, 'Approved report after UI-only verification.', note, false);
    this.showToast('Report approved in mock state.');
  }

  rejectReport(id: string, reason: string, note = ''): boolean {
    if (!reason.trim()) {
      this.showToast('Add a rejection reason before rejecting.');
      return false;
    }
    this.updateReportVerification(id, 'REJECTED', `Rejected: ${reason}`, note);
    this.addActivity('REPORT_REJECTED', id, 'Rejected report in mock state.', reason, true);
    this.showToast('Report rejected in mock state.');
    return true;
  }

  markReportDuplicate(id: string, parentReportId: string): void {
    this.updateReportVerification(id, 'DUPLICATE', `Marked duplicate of ${parentReportId}.`, '');
    this.addActivity('REPORT_MARKED_DUPLICATE', id, `Marked as duplicate of ${parentReportId}.`, undefined, true);
    this.showToast('Duplicate decision stored in mock state.');
  }

  convertReportToRescue(id: string): void {
    this.addActivity('RESCUE_CASE_CREATED', id, 'Converted report to a mock rescue workflow item.', undefined, true);
    this.showToast('Rescue conversion recorded for frontend mock review.');
  }

  updateDuplicateState(id: string, state: DuplicateSuggestion['state'], selectedParentReportId?: string): void {
    this.duplicateSuggestions.update((items) =>
      items.map((item) => (item.id === id ? { ...item, selectedParentReportId, state } : item)),
    );
    if (state === 'CONFIRMED') {
      const suggestion = this.findDuplicate(id);
      if (suggestion) {
        this.markReportDuplicate(suggestion.candidateReportId, selectedParentReportId ?? suggestion.primaryReportId);
      }
    } else {
      this.addActivity('REPORT_MARKED_DUPLICATE', id, `Duplicate suggestion marked ${state.toLowerCase()}.`, undefined, false);
      this.showToast('Duplicate review updated in mock state.');
    }
  }

  savePrivacySettings(settings: PrivacySettings): boolean {
    if (settings.defaultPublicRadiusMeters < settings.minRadiusMeters || settings.defaultPublicRadiusMeters > settings.maxRadiusMeters) {
      this.showToast('Public radius must stay within the configured range.');
      return false;
    }
    this.privacySettings.set({ ...settings, lastSavedAt: 'Just now' });
    this.addActivity('PRIVACY_SETTING_CHANGED', 'Privacy settings', 'Saved mock privacy settings.', undefined, true);
    this.showToast('Privacy settings saved in mock state.');
    return true;
  }

  resetPrivacySettings(): void {
    this.privacySettings.set({ ...privacySettingsFixture });
    this.showToast('Privacy settings reset to mock defaults.');
  }

  setUserRole(userId: string, role: AdminUserRole, enabled: boolean): boolean {
    const current = this.findUser(userId);
    if (!current) {
      return false;
    }
    if (current.id === 'user-nicha' && role === 'ADMIN' && !enabled && current.roles.includes('ADMIN')) {
      this.showToast('The current mock admin cannot remove their final Admin role.');
      return false;
    }
    const roles = enabled ? Array.from(new Set([...current.roles, role])) : current.roles.filter((item) => item !== role);
    this.users.update((users) => users.map((item) => (item.id === userId ? { ...item, roles } : item)));
    this.addActivity('USER_ROLE_CHANGED', current.name, `${enabled ? 'Granted' : 'Removed'} ${role} role.`, undefined, true);
    this.showToast('User roles updated in mock state.');
    return true;
  }

  setVolunteerVerification(userId: string, state: VolunteerVerificationState): void {
    const user = this.findUser(userId);
    this.users.update((users) => users.map((item) => (item.id === userId ? { ...item, volunteerVerification: state } : item)));
    this.addActivity('VOLUNTEER_VERIFIED', user?.name ?? userId, `Volunteer verification changed to ${state}.`, undefined, true);
    this.showToast('Volunteer verification updated.');
  }

  setAccountStatus(userId: string, status: AdminAccountStatus): void {
    const user = this.findUser(userId);
    this.users.update((users) => users.map((item) => (item.id === userId ? { ...item, accountStatus: status } : item)));
    this.addActivity('ACCOUNT_SUSPENDED', user?.name ?? userId, `Account status changed to ${status}.`, undefined, true);
    this.showToast('Account status updated in mock state.');
  }

  showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      this.toast.set(null);
    }, 3000);
  }

  private updateReportVerification(
    id: string,
    verification: AdminReportVerificationState,
    summary: string,
    note: string,
  ): void {
    const entry = this.activityEntry('Admin Mai', id, summary, note, verification === 'REJECTED' || verification === 'DUPLICATE');
    this.reports.update((reports) =>
      reports.map((item) =>
        item.id === id || item.reference === id
          ? {
              ...item,
              adminNotes: note.trim() ? [note.trim(), ...item.adminNotes] : item.adminNotes,
              history: [entry, ...item.history],
              verification,
            }
          : item,
      ),
    );
  }

  private addActivity(
    type: AdminActivity['type'],
    entity: string,
    summary: string,
    reason?: string,
    sensitive = false,
  ): void {
    this.activity.update((items) => [
      {
        ...this.activityEntry('Admin Mai', entity, summary, reason, sensitive),
        type,
      },
      ...items,
    ]);
  }

  private activityEntry(
    actor: string,
    entity: string,
    summary: string,
    reason?: string,
    sensitive = false,
  ): AdminActivity {
    return {
      actor,
      entity,
      id: `act-${String(Date.now())}`,
      occurredAt: 'Just now',
      reason,
      sensitive,
      summary,
      type: 'REPORT_APPROVED',
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AdminVerificationState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class AdminRescueState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class PrivacySettingsState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class AdminUserState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class AnalyticsState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class HeatmapState extends AdminWorkspaceDataSource {}

@Injectable({ providedIn: 'root' })
export class ExecutiveReportState extends AdminWorkspaceDataSource {}
