import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, firstValueFrom, Observable, shareReplay, tap } from 'rxjs';

import { AuthApiService } from './auth-api.service.js';
import type {
  ApiErrorResponse,
  AuthResponse,
  AuthUser,
  AuthenticationStatus,
  LoginRequest,
  RegisterRequest,
} from './auth.models.js';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly api = inject(AuthApiService);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly statusState = signal<AuthenticationStatus>('initializing');
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private initializationPromise: Promise<void> | null = null;
  private refreshRequest$: Observable<AuthResponse> | null = null;

  readonly user = this.userState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly initialized = computed(() => this.statusState() !== 'initializing');
  readonly roles = computed(() => this.userState()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.statusState() === 'authenticated');
  readonly isAdmin = computed(() => this.roles().includes('ADMIN'));
  readonly isVolunteer = computed(() => this.roles().includes('VOLUNTEER'));

  initializeSession(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.statusState.set('initializing');
    this.errorState.set(null);
    this.initializationPromise = this.restoreSession();
    return this.initializationPromise;
  }

  async login(request: LoginRequest): Promise<boolean> {
    if (this.loadingState()) {
      return false;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const session = await firstValueFrom(this.api.login(request));
      this.setSession(session);
      return true;
    } catch (error) {
      this.clearLocalSession();
      this.errorState.set(this.toUserMessage(error, 'Invalid email or password.'));
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  async register(request: RegisterRequest): Promise<boolean> {
    if (this.loadingState()) {
      return false;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const session = await firstValueFrom(this.api.register(request));
      this.setSession(session);
      return true;
    } catch (error) {
      this.clearLocalSession();
      this.errorState.set(this.toUserMessage(error, 'Unable to create that account.'));
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  refreshSession(): Observable<AuthResponse> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.api.refresh().pipe(
      tap((session) => {
        this.setSession(session);
      }),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refreshRequest$;
  }

  async loadCurrentUser(): Promise<void> {
    const user = await firstValueFrom(this.api.me());
    this.userState.set(user);
    this.statusState.set('authenticated');
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } catch {
      // Local session state is cleared even if the backend is temporarily unavailable.
    } finally {
      this.clearLocalSession();
    }
  }

  clearAfterAuthenticationFailure(): void {
    this.clearLocalSession();
  }

  resetError(): void {
    this.errorState.set(null);
  }

  private async restoreSession(): Promise<void> {
    try {
      await firstValueFrom(this.refreshSession());
      await this.loadCurrentUser();
      this.errorState.set(null);
    } catch {
      this.clearLocalSession();
      this.errorState.set(null);
    } finally {
      this.initializationPromise = null;
    }
  }

  private setSession(session: AuthResponse): void {
    this.accessTokenState.set(session.accessToken);
    this.userState.set(session.user);
    this.statusState.set('authenticated');
    this.errorState.set(null);
  }

  private clearLocalSession(): void {
    this.accessTokenState.set(null);
    this.userState.set(null);
    this.statusState.set('anonymous');
  }

  private toUserMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 0) {
      return 'The PetRadar API is unavailable. Please try again soon.';
    }

    if (error.status === 401) {
      return 'Invalid email or password.';
    }

    if (error.status === 409) {
      return 'An account with that email already exists.';
    }

    if (error.status === 400) {
      const body = error.error as Partial<ApiErrorResponse> | null;
      const message = body?.message;
      if (Array.isArray(message) && message.length > 0) {
        return message.join(' ');
      }
      if (typeof message === 'string') {
        return message;
      }
      return 'Check the form fields and try again.';
    }

    return fallback;
  }
}
