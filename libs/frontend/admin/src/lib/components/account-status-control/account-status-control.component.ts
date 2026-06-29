import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AdminAccountStatus, VolunteerVerificationState } from '@petradar/frontend/mock-data';

@Component({
  selector: 'pr-account-status-control',
  standalone: true,
  template: `
    <section class="account-control">
      <h2>Account Controls</h2>
      <p>Current account status: <b>{{ accountStatus() }}</b></p>
      <div class="button-row">
        <button type="button" (click)="accountChanged.emit('SUSPENDED')">Suspend</button>
        <button type="button" class="secondary" (click)="accountChanged.emit('ACTIVE')">Reactivate</button>
      </div>
      <p>Volunteer verification: <b>{{ volunteerVerification() }}</b></p>
      <div class="button-row">
        <button type="button" (click)="volunteerChanged.emit('VERIFIED')">Verify Volunteer</button>
        <button type="button" class="secondary" (click)="volunteerChanged.emit('REJECTED')">Reject Volunteer</button>
      </div>
    </section>
  `,
  styles: [
    `
      .account-control {
        display: grid;
        gap: 0.75rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      .button-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      button {
        min-height: 2.75rem;
        border: 1px solid var(--color-danger);
        border-radius: var(--radius-control);
        background: var(--color-danger);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
      }

      .secondary {
        border-color: var(--color-primary);
        background: var(--color-surface);
        color: var(--color-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusControlComponent {
  readonly accountChanged = output<AdminAccountStatus>();
  readonly accountStatus = input.required<AdminAccountStatus>();
  readonly volunteerChanged = output<VolunteerVerificationState>();
  readonly volunteerVerification = input.required<VolunteerVerificationState>();
}
