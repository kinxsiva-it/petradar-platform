import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideChevronDown } from '@lucide/angular';

import { AuthStateService } from '../auth/auth-state.service.js';

@Component({
  selector: 'pr-account-menu',
  standalone: true,
  imports: [LucideChevronDown, RouterLink],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuComponent {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  readonly auth = inject(AuthStateService);
  readonly initials = computed(() => initialsFor(this.auth.user()?.displayName));
  readonly open = signal(false);
  readonly roleLabel = computed(() =>
    this.auth.roles().filter((role) => role !== 'GUEST').join(', ') || 'Member',
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && event.target instanceof Node && !this.element.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  async signOut(): Promise<void> {
    this.close();
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}

function initialsFor(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return 'PR';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}
