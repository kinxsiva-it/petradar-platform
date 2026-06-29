import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pr-public-shell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen">
      <header class="sticky top-0 z-20 border-b border-border-default bg-surface/95 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a routerLink="/" class="flex items-center gap-3 text-xl font-bold text-primary">
            <span class="grid size-9 place-items-center rounded-full bg-primary text-white">P</span>
            PetRadar
          </a>
          <nav class="hidden items-center gap-6 text-sm font-medium text-text-default md:flex">
            <a routerLink="/" class="hover:text-primary">Map</a>
            <a routerLink="/lost-pets" class="hover:text-primary">Lost Pets</a>
            <a routerLink="/community-guidelines" class="hover:text-primary">Guidelines</a>
          </nav>
          <a routerLink="/login" class="signin-link">Sign in</a>
        </div>
      </header>
      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ng-content />
      </main>
    </div>
  `,
  styles: [
    `
      .signin-link {
        min-height: 2.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-control);
        color: var(--color-primary);
        padding: 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 800;
        text-decoration: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShellComponent {}
