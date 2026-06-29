import { Injectable, signal } from '@angular/core';

import type {
  AuthPreviewResult,
  LoginPreviewForm,
  RegisterPreviewForm,
} from '../models/auth-preview.model.js';

@Injectable({ providedIn: 'root' })
export class AuthPreviewState {
  readonly loading = signal(false);
  readonly lastResult = signal<AuthPreviewResult | null>(null);

  submitLogin(form: LoginPreviewForm): void {
    this.loading.set(true);
    this.lastResult.set(this.validateLogin(form));
    this.loading.set(false);
  }

  submitRegistration(form: RegisterPreviewForm): void {
    this.loading.set(true);
    this.lastResult.set(this.validateRegistration(form));
    this.loading.set(false);
  }

  resetResult(): void {
    this.lastResult.set(null);
  }

  private validateLogin(form: LoginPreviewForm): AuthPreviewResult {
    if (!form.email.includes('@') || form.password.length < 6) {
      return {
        ok: false,
        message: 'Use a valid email and a password with at least 6 characters.',
      };
    }

    if (form.email.toLowerCase().includes('invalid')) {
      return {
        ok: false,
        message: 'Invalid-login state preview: this account was not found.',
      };
    }

    return {
      ok: true,
      message: 'Mock login succeeded. No real authentication was performed.',
    };
  }

  private validateRegistration(form: RegisterPreviewForm): AuthPreviewResult {
    if (!form.name.trim() || !form.email.includes('@')) {
      return {
        ok: false,
        message: 'Enter your name and a valid email address.',
      };
    }

    if (form.password.length < 8 || form.password !== form.confirmPassword) {
      return {
        ok: false,
        message: 'Passwords must match and be at least 8 characters.',
      };
    }

    if (!form.acceptedGuidelines) {
      return {
        ok: false,
        message: 'Acknowledge the community guidelines before creating an account.',
      };
    }

    return {
      ok: true,
      message: 'Mock account created. Admin and volunteer privileges are not selectable here.',
    };
  }
}

