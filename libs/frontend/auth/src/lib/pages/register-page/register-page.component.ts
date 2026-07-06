import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  AUTH_DEFAULT_REDIRECT_URL,
  AuthStateService,
  DEFAULT_AUTH_REDIRECT_URL,
  safeReturnUrl,
} from '@petradar/frontend/core';
import { AlertComponent, ButtonComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import type { RegisterPreviewForm } from '../../models/auth-preview.model.js';

@Component({
  selector: 'pr-register-page',
  standalone: true,
  imports: [AlertComponent, ButtonComponent, FormsModule, PrivacyBannerComponent, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  readonly authState = inject(AuthStateService);
  readonly showPassword = signal(false);
  readonly localError = signal<string | null>(null);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly defaultRedirectUrl =
    inject(AUTH_DEFAULT_REDIRECT_URL, { optional: true }) ?? DEFAULT_AUTH_REDIRECT_URL;
  readonly form: RegisterPreviewForm = {
    acceptedGuidelines: false,
    confirmPassword: '',
    email: '',
    name: '',
    password: '',
  };

  async submit(): Promise<void> {
    if (this.authState.loading()) {
      return;
    }

    this.localError.set(null);
    this.authState.resetError();

    const validationMessage = this.validateForm();
    if (validationMessage) {
      this.localError.set(validationMessage);
      return;
    }

    const success = await this.authState.register({
      displayName: this.form.name,
      email: this.form.email,
      password: this.form.password,
    });

    if (success) {
      await this.router.navigateByUrl(this.returnUrl());
    }
  }

  private validateForm(): string | null {
    if (!this.form.name.trim() || !this.form.email.includes('@')) {
      return 'Enter your name and a valid email address.';
    }

    if (this.form.password.length < 12) {
      return 'Use a password with at least 12 characters.';
    }

    if (this.form.password !== this.form.confirmPassword) {
      return 'Passwords must match.';
    }

    if (!this.form.acceptedGuidelines) {
      return 'Acknowledge the community guidelines before creating an account.';
    }

    return null;
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return safeReturnUrl(value) ?? this.defaultRedirectUrl;
  }
}

