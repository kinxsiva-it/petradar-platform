import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  AlertComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  IconButtonComponent,
  InputComponent,
  PageHeaderComponent,
  PublicShellComponent,
  SelectComponent,
  StatusBadgeComponent,
} from '@petradar/frontend/shared-ui';

@Component({
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FormFieldComponent,
    IconButtonComponent,
    InputComponent,
    PageHeaderComponent,
    PublicShellComponent,
    SelectComponent,
    StatusBadgeComponent,
  ],
  template: `
    <pr-public-shell>
      <div class="grid gap-8">
        <pr-page-header
          eyebrow="Design system"
          title="Phase 0 component showcase"
          description="A compact development route for validating foundational components against the reference boards."
        />

        <section class="grid gap-4 lg:grid-cols-2">
          <pr-card>
            <h2 class="text-lg font-semibold text-text-strong">Actions</h2>
            <div class="mt-4 flex flex-wrap gap-3">
              <pr-button>Report Animal</pr-button>
              <pr-button variant="secondary">View Case</pr-button>
              <pr-button variant="tertiary">View on Map</pr-button>
              <pr-button variant="ghost">Share</pr-button>
              <pr-button variant="danger">Emergency Action</pr-button>
              <pr-icon-button label="More options">...</pr-icon-button>
            </div>
          </pr-card>

          <pr-card>
            <h2 class="text-lg font-semibold text-text-strong">Badges</h2>
            <div class="mt-4 flex flex-wrap gap-3">
              <pr-status-badge label="New" />
              <pr-status-badge label="Verified" tone="success" />
              <pr-status-badge label="Needs attention" tone="warning" />
              <pr-status-badge label="Injured" tone="danger" />
              <pr-status-badge label="Possible match" tone="match" />
            </div>
          </pr-card>
        </section>

        <section class="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <pr-card>
            <h2 class="text-lg font-semibold text-text-strong">Forms</h2>
            <div class="mt-4 grid gap-4">
              <pr-form-field label="Search" hint="Search cases, animals, or locations.">
                <pr-input type="search" placeholder="Search PetRadar" />
              </pr-form-field>
              <pr-form-field label="Species">
                <pr-select
                  [options]="[
                    { label: 'Dog', value: 'dog' },
                    { label: 'Cat', value: 'cat' },
                    { label: 'Other', value: 'other' }
                  ]"
                />
              </pr-form-field>
            </div>
          </pr-card>

          <div class="grid gap-4">
            <pr-alert title="Location privacy" tone="privacy">
              Approximate locations are shown publicly. Exact locations stay restricted.
            </pr-alert>
            <pr-alert title="Upload failed" tone="danger">
              The selected file could not be uploaded. Try again with a JPG or PNG under the configured limit.
            </pr-alert>
          </div>
        </section>

        <pr-empty-state
          icon="i"
          title="No matching components yet"
          description="Larger domain components such as map markers, match rings, and rescue timelines are planned for their implementation phases."
        />
      </div>
    </pr-public-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentShowcasePage {}
