import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { AdminUserRole } from '@petradar/frontend/mock-data';

const roles: AdminUserRole[] = ['REPORTER', 'PET_OWNER', 'VOLUNTEER', 'ADMIN'];

@Component({
  selector: 'pr-role-editor',
  standalone: true,
  template: `
    <section class="role-editor">
      <h2>Roles</h2>
      @for (role of availableRoles; track role) {
        <label>
          <input type="checkbox" [checked]="roles().includes(role)" (change)="changed.emit({ role, enabled: $any($event.target).checked })" />
          {{ role }}
        </label>
      }
    </section>
  `,
  styles: [
    `
      .role-editor {
        display: grid;
        gap: 0.55rem;
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-panel);
        background: var(--color-surface);
        padding: 1rem;
      }

      h2 {
        margin: 0;
        color: var(--color-text-strong);
        font: var(--text-heading-3);
      }

      label {
        min-height: 2.5rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditorComponent {
  readonly availableRoles = roles;
  readonly changed = output<{ role: AdminUserRole; enabled: boolean }>();
  readonly roles = input.required<AdminUserRole[]>();
}
