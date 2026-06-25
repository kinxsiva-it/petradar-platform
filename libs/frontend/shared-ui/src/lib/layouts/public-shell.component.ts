import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../button/button.component.js';

@Component({
  selector: 'pr-public-shell',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
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
            <a routerLink="/showcase" class="hover:text-primary">Components</a>
            <a routerLink="/dashboard" class="hover:text-primary">Dashboard</a>
          </nav>
          <pr-button variant="secondary" size="sm">Sign in</pr-button>
        </div>
      </header>
      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ng-content />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShellComponent {}
