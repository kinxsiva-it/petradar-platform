import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pr-report-verification-actions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="actions-panel">
      <h2>Admin Decision</h2>
      <label>
        Admin note
        <textarea [(ngModel)]="note" rows="3"></textarea>
      </label>
      <div class="button-row">
        <button type="button" (click)="confirm.set('approve')">Approve</button>
        <button type="button" class="danger" (click)="confirm.set('reject')">Reject</button>
        <button type="button" class="secondary" (click)="duplicate.emit()">Mark duplicate</button>
        <button type="button" class="secondary" (click)="rescue.emit()">Convert to rescue</button>
      </div>

      @if (confirm() === 'approve') {
        <div class="confirm" role="dialog" aria-label="Approve report">
          <p>Approve this report in frontend mock state with current privacy settings?</p>
          <button type="button" (click)="approved.emit(note); confirm.set(null)">Confirm approve</button>
        </div>
      }

      @if (confirm() === 'reject') {
        <div class="confirm" role="dialog" aria-label="Reject report">
          <label>
            Required rejection reason
            <input [(ngModel)]="reason" />
          </label>
          @if (error()) {
            <small>{{ error() }}</small>
          }
          <button type="button" class="danger" (click)="reject()">Confirm reject</button>
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

      textarea,
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

      .secondary {
        background: var(--color-surface);
        color: var(--color-primary);
      }

      .danger {
        border-color: var(--color-danger);
        background: var(--color-danger);
      }

      small {
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
  readonly reportId = input.required<string>();
  readonly approved = output<string>();
  readonly rejected = output<{ reason: string; note: string }>();
  readonly duplicate = output<void>();
  readonly rescue = output<void>();
  readonly confirm = signal<'approve' | 'reject' | null>(null);
  readonly error = signal('');
  note = '';
  reason = '';

  reject(): void {
    if (!this.reason.trim()) {
      this.error.set('A rejection reason is required.');
      return;
    }
    this.rejected.emit({ note: this.note, reason: this.reason });
    this.error.set('');
    this.confirm.set(null);
  }
}
