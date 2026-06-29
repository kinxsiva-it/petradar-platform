import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AdminReport } from '@petradar/frontend/mock-data';
import { AlertComponent, StatusBadgeComponent } from '@petradar/frontend/shared-ui';

@Component({
  selector: 'pr-report-review-panel',
  standalone: true,
  imports: [AlertComponent, RouterLink, StatusBadgeComponent],
  template: `
    @if (report(); as item) {
      <aside class="review-panel" role="dialog" aria-label="Report review panel">
        <button type="button" class="close" (click)="closed.emit()">Close</button>
        <img [src]="item.photoUrls[0]" [alt]="item.title" />
        <div class="panel-heading">
          <p>{{ item.reference }}</p>
          <h2>{{ item.title }}</h2>
          <pr-status-badge [label]="item.verification" tone="match" />
        </div>
        <dl>
          <div><dt>Species</dt><dd>{{ item.species }}</dd></div>
          <div><dt>Condition</dt><dd>{{ item.condition }}</dd></div>
          <div><dt>Urgency</dt><dd>{{ item.urgency }}</dd></div>
          <div><dt>Approximate area</dt><dd>{{ item.location.approximateLabel }}</dd></div>
          <div><dt>Reporter</dt><dd>{{ item.reporter.name }} · Trust {{ item.reporter.trustScore }}</dd></div>
        </dl>
        <pr-alert title="Sensitive location warning" tone="warning">
          Internal location text is mock-only and must be protected by server authorization later.
        </pr-alert>
        <div class="actions">
          <a [routerLink]="['/admin/verification', item.id]">Open full detail</a>
          <button type="button" (click)="approved.emit(item.id)">Approve</button>
          <button type="button" class="danger" (click)="rejected.emit(item.id)">Reject</button>
        </div>
      </aside>
    }
  `,
  styles: [
    `
      .review-panel {
        position: sticky;
        top: calc(var(--header-height) + 1rem);
        display: grid;
        gap: 1rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
        box-shadow: var(--shadow-panel);
      }

      .close {
        justify-self: end;
      }

      img {
        width: 100%;
        aspect-ratio: 16 / 10;
        border-radius: var(--radius-card);
        object-fit: cover;
      }

      h2,
      p,
      dl {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      .panel-heading {
        display: grid;
        gap: 0.35rem;
      }

      dl {
        display: grid;
        gap: 0.55rem;
      }

      dl div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      dt {
        color: var(--color-text-muted);
      }

      dd {
        margin: 0;
        color: var(--color-text-strong);
        font-weight: 750;
        text-align: right;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      .actions a {
        grid-column: 1 / -1;
      }

      button,
      a {
        min-height: 2.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        background: var(--color-primary);
        color: white;
        padding: 0 0.8rem;
        font-weight: 800;
        text-decoration: none;
      }

      button.close {
        border-color: var(--color-border-default);
        background: var(--color-surface);
        color: var(--color-text-strong);
      }

      .danger {
        border-color: var(--color-danger);
        background: var(--color-danger);
      }

      @media (max-width: 1080px) {
        .review-panel {
          position: static;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportReviewPanelComponent {
  readonly approved = output<string>();
  readonly closed = output<void>();
  readonly rejected = output<string>();
  readonly report = input<AdminReport | undefined>();
}
