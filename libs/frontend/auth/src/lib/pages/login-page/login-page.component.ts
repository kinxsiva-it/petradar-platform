import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AlertComponent, ButtonComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import { AuthPreviewState } from '../../data-access/auth-preview.state.js';
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
  readonly authState = inject(AuthPreviewState);
  readonly showPassword = signal(false);
  readonly form: LoginPreviewForm = {
    email: '',
    password: '',
    remember: true,
  };

  submit(): void {
    this.authState.submitLogin(this.form);
  }
}

