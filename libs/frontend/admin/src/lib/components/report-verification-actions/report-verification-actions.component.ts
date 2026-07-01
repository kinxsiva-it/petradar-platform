import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pr-report-verification-actions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="actions-panel">
      <h2>Admin Decision</h2>
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
      <div class="button-row">
        <button
          type="button"
          [disabled]="processing() || !canVerify()"
          (click)="confirm.set('verify')"
        >
          Verify
        </button>
        <button
          type="button"
          class="danger"
          [disabled]="processing() || !canReject()"
          (click)="confirm.set('reject')"
        >
          Reject
        </button>
      </div>

      @if (confirm() === 'verify') {
        <div class="confirm" role="dialog" aria-label="Verify report">
          <p>Verify this animal sighting?</p>
          <button type="button" [disabled]="processing()" (click)="approved.emit(); confirm.set(null)">
            Confirm verify
          </button>
        </div>
      }

      @if (confirm() === 'reject') {
        <div class="confirm" role="dialog" aria-label="Reject report">
          <label>
            Required rejection reason
            <input [(ngModel)]="reason" maxlength="600" />
          </label>
          @if (error()) {
            <small>{{ error() }}</small>
          }
          <button type="button" class="danger" [disabled]="processing()" (click)="reject()">
            Confirm reject
          </button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .actions-panel,
      .confirm {
        display: grid;
        gap: 0.8rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-card);
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      label {
        display: grid;
        gap: 0.35rem;
        color: var(--color-text-muted);
        font-weight: 750;
      }

      input {
        min-width: 0;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-control);
        padding: 0.7rem;
      }

      .button-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }

      button {
        min-height: 2.75rem;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .danger {
        border-color: var(--color-danger);
        background: var(--color-danger);
      }

      small,
      .error {
        color: var(--color-danger);
      }

      @media (max-width: 520px) {
        .button-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportVerificationActionsComponent {
  readonly approved = output();
  readonly rejected = output<string>();
  readonly canReject = input(true);
  readonly canVerify = input(true);
  readonly errorMessage = input('');
  readonly processing = input(false);
  readonly confirm = signal<'verify' | 'reject' | null>(null);
  readonly error = signal('');
  reason = '';

  reject(): void {
    const trimmed = this.reason.trim();
    if (trimmed.length < 8) {
      this.error.set('Use at least 8 characters.');
      return;
    }
    if (trimmed.length > 600) {
      this.error.set('Use 600 characters or fewer.');
      return;
    }
    this.error.set('');
    this.rejected.emit(trimmed);
  }
}
