import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AdminModerationHistoryItem } from '../../data-access/admin-sightings-api.models.js';

interface LegacyAdminActivityItem {
  id: string;
  type: string;
  summary: string;
  actor: string;
  occurredAt: string;
  sensitive: boolean;
}

type ActivityListItem = AdminModerationHistoryItem | LegacyAdminActivityItem;

@Component({
  selector: 'pr-admin-activity-list',
  standalone: true,
  template: `
    <section class="activity-list">
      <h2>{{ title() }}</h2>
      @for (item of items(); track item.id) {
        <article>
          <span aria-hidden="true" [class.sensitive]="isSensitive(item)"></span>
          <div>
            <b>{{ labelFor(item) }}</b>
            <p>{{ summaryFor(item) }}</p>
            <small>{{ actorFor(item) }} · {{ occurredAtFor(item) }}</small>
          </div>
        </article>
      } @empty {
        <p class="empty">No moderation activity yet.</p>
      }
    </section>
  `,
  styles: [
    `
      .activity-list {
        display: grid;
        gap: 0.8rem;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      article {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.75rem;
      }

      article > span {
        width: 0.8rem;
        height: 0.8rem;
        margin-top: 0.25rem;
        border-radius: 999px;
        background: var(--color-primary);
      }

      article > span.sensitive {
        background: var(--color-warning);
      }

      b,
      small {
        display: block;
      }

      b {
        color: var(--color-text-strong);
      }

      small,
      .empty {
        color: var(--color-text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityListComponent {
  readonly items = input.required<ActivityListItem[]>();
  readonly title = input('Admin Activity');

  labelFor(item: ActivityListItem): string {
    return isModerationHistory(item) ? item.action.replaceAll('_', ' ') : item.type;
  }

  summaryFor(item: ActivityListItem): string {
    if (!isModerationHistory(item)) {
      return item.summary;
    }
    if (item.rejectionReason) {
      return item.rejectionReason;
    }
    if (item.previousVerificationStatus && item.newVerificationStatus) {
      return `${item.previousVerificationStatus} to ${item.newVerificationStatus}`;
    }
    return 'Safe moderation event recorded.';
  }

  actorFor(item: ActivityListItem): string {
    return isModerationHistory(item) ? item.actorDisplayName ?? 'System' : item.actor;
  }

  occurredAtFor(item: ActivityListItem): string {
    return isModerationHistory(item)
      ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(item.createdAt),
        )
      : item.occurredAt;
  }

  isSensitive(item: ActivityListItem): boolean {
    return isModerationHistory(item) ? item.action.includes('EXACT_LOCATION') : item.sensitive;
  }
}

function isModerationHistory(item: ActivityListItem): item is AdminModerationHistoryItem {
  return 'action' in item;
}
