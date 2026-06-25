import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const links = ['Dashboard', 'Map', 'Lost Pets', 'Sightings', 'Rescue Cases', 'Notifications'];

@Component({
  selector: 'pr-dashboard-shell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-background-warm md:grid md:grid-cols-[17rem_1fr]">
      <aside class="hidden border-r border-border-default bg-surface px-4 py-5 md:block">
        <a routerLink="/" class="mb-8 flex items-center gap-3 text-xl font-bold text-primary">
          <span class="grid size-9 place-items-center rounded-full bg-primary text-white">P</span>
          PetRadar
        </a>
        <nav class="grid gap-1">
          @for (link of navigationLinks; track link) {
            <a class="rounded-control px-3 py-2 text-sm font-medium text-text-default hover:bg-primary-subtle hover:text-primary">
              {{ link }}
            </a>
          }
        </nav>
      </aside>
      <div class="pb-20 md:pb-0">
        <header class="sticky top-0 z-10 border-b border-border-default bg-surface/95 px-4 py-4 backdrop-blur md:px-8">
          <div class="flex items-center justify-between">
            <a routerLink="/" class="flex items-center gap-2 font-bold text-primary md:hidden">
              <span class="grid size-8 place-items-center rounded-full bg-primary text-white">P</span>
              PetRadar
            </a>
            <div class="hidden text-sm font-semibold text-text-strong md:block">Community operations</div>
            <div class="rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
              Phase 0
            </div>
          </div>
        </header>
        <main class="px-4 py-6 md:px-8">
          <ng-content />
        </main>
      </div>
      <nav class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border-default bg-surface p-2 md:hidden">
        @for (link of mobileLinks; track link) {
          <a class="min-h-12 rounded-control px-2 py-1 text-center text-xs font-semibold text-text-default hover:bg-primary-subtle hover:text-primary">
            {{ link }}
          </a>
        }
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardShellComponent {
  readonly navigationLinks = links;
  readonly mobileLinks = ['Home', 'Map', 'Report', 'More'];
}
