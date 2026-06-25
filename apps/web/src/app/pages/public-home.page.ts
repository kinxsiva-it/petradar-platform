import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  AlertComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  PublicShellComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

@Component({
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    PublicShellComponent,
    StatusBadgeComponent,
  ],
  template: `
    <pr-public-shell>
      <section class="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div class="grid gap-6">
          <pr-page-header
            eyebrow="Community animal welfare"
            title="Find, report, and coordinate help for animals nearby"
            description="PetRadar starts with a privacy-first map foundation. Phase 0 establishes the shell, design tokens, shared components, API health check, and database baseline."
          >
            <div class="flex flex-wrap gap-3">
              <pr-button>Report Animal</pr-button>
              <pr-button variant="secondary">Search Lost Pet</pr-button>
            </div>
          </pr-page-header>

          <pr-alert title="Exact locations stay protected" tone="privacy">
            Public map surfaces will use stable approximate coordinates. Exact coordinates are reserved
            for authorized admins and verified rescue workflows in later phases.
          </pr-alert>

          <div class="grid gap-4 md:grid-cols-3">
            <pr-card>
              <pr-status-badge label="Verified sighting" tone="success" />
              <h2 class="mt-4 text-lg font-semibold text-text-strong">Map foundation</h2>
              <p class="mt-2 text-sm text-text-muted">
                Leaflet and OpenStreetMap dependencies are declared for Phase 1 map work.
              </p>
            </pr-card>
            <pr-card>
              <pr-status-badge label="Needs attention" tone="warning" />
              <h2 class="mt-4 text-lg font-semibold text-text-strong">Workflow ready</h2>
              <p class="mt-2 text-sm text-text-muted">
                Feature-first routes and module boundaries are ready for sightings, lost pets, and cases.
              </p>
            </pr-card>
            <pr-card>
              <pr-status-badge label="Possible match" tone="match" />
              <h2 class="mt-4 text-lg font-semibold text-text-strong">Shared UI</h2>
              <p class="mt-2 text-sm text-text-muted">
                Foundational components use semantic tokens and compact operational layouts.
              </p>
            </pr-card>
          </div>
        </div>

        <pr-empty-state
          icon="?"
          title="No reports loaded yet"
          description="Phase 0 avoids hard-coded runtime report data. Seed data and real API flows start in later milestones."
        >
          <pr-button variant="secondary">View Component Showcase</pr-button>
        </pr-empty-state>
      </section>
    </pr-public-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHomePage {}
