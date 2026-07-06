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

import type { LoginPreviewForm } from '../../models/auth-preview.model.js';

@Component({
  selector: 'pr-login-page',
  standalone: true,
  imports: [AlertComponent, ButtonComponent, FormsModule, PrivacyBannerComponent, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly authState = inject(AuthStateService);
  readonly showPassword = signal(false);
  readonly localError = signal<string | null>(null);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly defaultRedirectUrl =
    inject(AUTH_DEFAULT_REDIRECT_URL, { optional: true }) ?? DEFAULT_AUTH_REDIRECT_URL;
  readonly form: LoginPreviewForm = {
    email: '',
    password: '',
    remember: true,
  };

  constructor() {
    if (this.route.snapshot.queryParamMap.get('access') === 'denied') {
      this.localError.set('Sign in with an account that has access to that area.');
    }
  }

  async submit(): Promise<void> {
    if (this.authState.loading()) {
      return;
    }

    this.localError.set(null);
    this.authState.resetError();

    if (!this.form.email.includes('@') || this.form.password.length < 1) {
      this.localError.set('Enter your email address and password.');
      return;
    }

    const success = await this.authState.login({
      email: this.form.email,
      password: this.form.password,
    });

    if (success) {
      await this.router.navigateByUrl(this.returnUrl());
    }
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    return safeReturnUrl(value) ?? this.defaultRedirectUrl;
  }
}

