import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AlertComponent, ButtonComponent, PrivacyBannerComponent } from '@petradar/frontend/shared-ui';

import { AuthPreviewState } from '../../data-access/auth-preview.state.js';
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
  readonly authState = inject(AuthPreviewState);
  readonly showPassword = signal(false);
  readonly form: RegisterPreviewForm = {
    acceptedGuidelines: false,
    confirmPassword: '',
    email: '',
    name: '',
    password: '',
  };

  submit(): void {
    this.authState.submitRegistration(this.form);
  }
}

