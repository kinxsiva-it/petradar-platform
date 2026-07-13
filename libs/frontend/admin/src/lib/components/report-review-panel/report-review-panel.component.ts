import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AlertComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

import type { AdminModerationQueueItem } from '../../data-access/admin-sightings-api.models.js';

@Component({
  selector: 'pr-report-review-panel',
  standalone: true,
  imports: [AlertComponent, DatePipe, RouterLink, StatusBadgeComponent],
  host: {
    '(document:keydown.escape)': 'closeFromKeyboard()',
  },
  template: `
    @if (report(); as item) {
      <div class="modal-backdrop" (click)="closeFromBackdrop($event)">
        <section
          #dialog
          class="review-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-review-title"
          tabindex="-1"
        >
          <header class="modal-header">
            <div>
              <p class="reference">{{ item.reference }}</p>
              <h2 id="report-review-title">{{ item.species }} sighting review</h2>
              <div class="badge-row">
                <pr-status-badge
                  [label]="item.urgency"
                  [tone]="item.urgency === 'HIGH' || item.urgency === 'EMERGENCY' ? 'danger' : 'warning'"
                />
                <pr-status-badge [label]="item.verificationStatus" tone="match" />
              </div>
            </div>
            <button type="button" class="icon-close" aria-label="Close report review" (click)="close()">×</button>
          </header>

          <div class="modal-body">
            @if (item.thumbnailPhoto) {
              <img class="report-photo" [src]="item.thumbnailPhoto.url" [alt]="item.reference" />
            } @else {
              <div class="photo-placeholder">No report photo available</div>
            }

            <div class="review-details">
              <dl>
                <div><dt>Species</dt><dd>{{ item.species }}</dd></div>
                <div><dt>Condition</dt><dd>{{ item.condition }}</dd></div>
                <div><dt>Urgency</dt><dd>{{ item.urgency }}</dd></div>
                <div><dt>Seen</dt><dd>{{ item.seenAt | date: 'medium' }}</dd></div>
                <div><dt>Reporter</dt><dd>{{ item.reporter.displayName }}</dd></div>
                <div><dt>Reporter ID</dt><dd>{{ item.reporter.id ?? 'Unavailable' }}</dd></div>
                <div><dt>Location shown here</dt><dd>Public approximate area only</dd></div>
              </dl>

              <pr-alert title="Sensitive location warning" tone="warning">
                Queue data is public-safe. Exact location and private reporter contact are available only through the authorized Admin detail response.
              </pr-alert>

              @if (errorMessage()) {
                <pr-alert title="Moderation unavailable" tone="danger">{{ errorMessage() }}</pr-alert>
              }
            </div>
          </div>

          <footer class="modal-footer">
            <a [routerLink]="['/verification', item.id]">Open full detail</a>
            <button type="button" class="secondary" (click)="close()">Close</button>
            <button type="button" class="danger" [disabled]="processing()" (click)="rejected.emit(item.id)">
              {{ processing() ? 'Saving...' : 'Reject' }}
            </button>
            <button type="button" [disabled]="processing()" (click)="approved.emit(item.id)">
              {{ processing() ? 'Saving...' : 'Verify' }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: grid;
        place-items: center;
        overflow-y: auto;
        background: rgb(18 49 42 / 0.55);
        padding: clamp(1rem, 3vw, 2rem);
        backdrop-filter: blur(3px);
      }

      .review-modal {
        display: grid;
        width: min(100%, 60rem);
        max-height: 88vh;
        grid-template-rows: auto minmax(0, 1fr) auto;
        overflow: hidden;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        box-shadow: var(--shadow-panel);
      }

      .modal-header,
      .modal-footer {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: var(--color-surface);
      }

      .modal-header {
        justify-content: space-between;
        border-bottom: 1px solid var(--color-border-default);
      }

      .modal-header > div {
        display: grid;
        gap: 0.4rem;
      }

      .reference,
      h2,
      dl {
        margin: 0;
      }

      .reference {
        color: var(--color-primary);
        font: var(--text-label);
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-2);
      }

      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .modal-body {
        display: grid;
        grid-template-columns: minmax(16rem, 0.8fr) minmax(20rem, 1fr);
        gap: 1.25rem;
        overflow-y: auto;
        padding: 1.25rem;
      }

      .report-photo,
      .photo-placeholder {
        width: 100%;
        min-height: 18rem;
        max-height: 24rem;
        border-radius: var(--radius-card);
        background: var(--color-surface-muted);
      }

      .report-photo {
        object-fit: cover;
      }

      .photo-placeholder {
        display: grid;
        place-items: center;
        color: var(--color-text-muted);
        font-weight: 750;
      }

      .review-details,
      dl {
        display: grid;
        align-content: start;
        gap: 0.8rem;
      }

      dl div {
        display: grid;
        grid-template-columns: minmax(7rem, 0.7fr) minmax(0, 1fr);
        gap: 1rem;
        border-bottom: 1px solid var(--color-border-default);
        padding-bottom: 0.65rem;
      }

      dt {
        color: var(--color-text-muted);
      }

      dd {
        margin: 0;
        overflow-wrap: anywhere;
        color: var(--color-text-strong);
        font-weight: 750;
        text-align: right;
      }

      .modal-footer {
        justify-content: flex-end;
        border-top: 1px solid var(--color-border-default);
      }

      button,
      a {
        display: inline-flex;
        min-height: 2.75rem;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.9rem;
        font-weight: 800;
        text-decoration: none;
      }

      button {
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .icon-close {
        width: 2.75rem;
        flex: 0 0 auto;
        border-color: var(--color-border-default);
        background: var(--color-surface);
        color: var(--color-text-strong);
        padding: 0;
        font-size: 1.5rem;
      }

      .secondary {
        border-color: var(--color-border-default);
        background: var(--color-surface);
        color: var(--color-text-strong);
      }

      .danger {
        border-color: var(--color-danger);
        background: var(--color-danger);
      }

      @media (max-width: 760px) {
        .modal-backdrop {
          place-items: stretch;
          padding: 0.75rem;
        }

        .review-modal {
          max-height: calc(100vh - 1.5rem);
        }

        .modal-body {
          grid-template-columns: 1fr;
        }

        .report-photo,
        .photo-placeholder {
          min-height: 13rem;
          max-height: 18rem;
        }

        .modal-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 480px) {
        .modal-footer {
          grid-template-columns: 1fr;
        }

        dl div {
          grid-template-columns: 1fr;
          gap: 0.25rem;
        }

        dd {
          text-align: left;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportReviewPanelComponent {
  readonly approved = output<string>();
  readonly closed = output();
  readonly errorMessage = input('');
  readonly processing = input(false);
  readonly rejected = output<string>();
  readonly report = input<AdminModerationQueueItem | undefined>();

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private returnFocus: HTMLElement | null = null;
  private openReportId: string | null = null;

  private readonly manageFocus = effect(() => {
    const report = this.report();
    if (report && report.id !== this.openReportId) {
      this.openReportId = report.id;
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setTimeout(() => this.dialog()?.nativeElement.focus());
      return;
    }

    if (!report && this.openReportId) {
      this.openReportId = null;
      const returnFocus = this.returnFocus;
      this.returnFocus = null;
      setTimeout(() => returnFocus?.focus());
    }
  });

  close(): void {
    this.closed.emit();
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  closeFromKeyboard(): void {
    if (this.report()) {
      this.close();
    }
  }
}
