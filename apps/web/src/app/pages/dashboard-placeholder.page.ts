import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  AlertComponent,
  ButtonComponent,
  CardComponent,
  DashboardShellComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

@Component({
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    CardComponent,
    DashboardShellComponent,
    LoadingSkeletonComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  template: `
    <pr-dashboard-shell>
      <div class="grid gap-6">
        <pr-page-header
          eyebrow="Authenticated layout"
          title="Operations dashboard shell"
          description="This placeholder verifies the responsive authenticated frame, cards, badges, loading state, and privacy banner before feature pages are built."
        >
          <pr-button variant="secondary">Open API Health</pr-button>
        </pr-page-header>

        <div class="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <pr-card>
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-text-strong">Boundary status</h2>
              <pr-status-badge label="Foundation" tone="success" />
            </div>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-sm font-semibold text-text-strong">Backend</p>
                <p class="mt-1 text-sm text-text-muted">
                  Nest modules are intentionally empty until their phase starts.
                </p>
              </div>
              <div>
                <p class="text-sm font-semibold text-text-strong">Frontend</p>
                <p class="mt-1 text-sm text-text-muted">
                  Feature libraries exist without Phase 1 business screens.
                </p>
              </div>
            </div>
          </pr-card>

          <pr-card>
            <h2 class="text-lg font-semibold text-text-strong">Loading state</h2>
            <div class="mt-4">
              <pr-loading-skeleton [rows]="4" />
            </div>
          </pr-card>
        </div>

        <pr-alert title="Privacy-first implementation rule" tone="warning">
          Exact animal coordinates must not enter unauthorized frontend state when Phase 1 map APIs are implemented.
        </pr-alert>
      </div>
    </pr-dashboard-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPlaceholderPage {}
