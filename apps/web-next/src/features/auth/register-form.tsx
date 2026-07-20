'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { routes, safeReturnUrl } from '../../lib/routes';
import { authErrorMessage } from './auth-error';
import { useAuth } from './use-auth';

export function RegisterForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      await auth.register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      router.replace(safeReturnUrl(searchParams.get('returnUrl')) ?? routes.myReports);
    } catch (submitError) {
      setError(authErrorMessage(submitError, 'Unable to create that account.'));
    } finally {
      setSubmitting(false);
    }
  }

  function validateForm(): string | null {
    if (displayName.trim().length < 2 || displayName.trim().length > 120) {
      return 'Enter a name between 2 and 120 characters.';
    }
    if (!email.trim() || !email.includes('@')) {
      return 'Enter a valid email address.';
    }
    if (phone.trim().length > 40) {
      return 'Phone number must be 40 characters or fewer.';
    }
    if (password.length < 12 || password.length > 128) {
      return 'Use a password between 12 and 128 characters.';
    }
    if (password !== confirmPassword) {
      return 'Passwords must match.';
    }
    if (!acceptedGuidelines) {
      return 'Acknowledge the community guidelines before creating an account.';
    }
    return null;
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}

      <label className="form-field">
        <span>Display name</span>
        <input
          autoComplete="name"
          maxLength={120}
          minLength={2}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
      </label>

      <label className="form-field">
        <span>Email address</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="form-field">
        <span>Phone <small>Optional</small></span>
        <input
          autoComplete="tel"
          maxLength={40}
          name="phone"
          onChange={(event) => setPhone(event.target.value)}
          type="tel"
          value={phone}
        />
      </label>

      <label className="form-field">
        <span>Password</span>
        <input
          aria-describedby="password-help"
          autoComplete="new-password"
          maxLength={128}
          minLength={12}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <small id="password-help">Use at least 12 characters.</small>
      </label>

      <label className="form-field">
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      <label className="check-field">
        <input
          checked={acceptedGuidelines}
          onChange={(event) => setAcceptedGuidelines(event.target.checked)}
          type="checkbox"
        />
        <span>I agree to follow the <Link href={routes.communityGuidelines}>Community Guidelines</Link>.</span>
      </label>

      <button className="primary-action form-submit" disabled={submitting} type="submit">
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="form-alternative">
        Already have an account? <Link href={routes.login}>Sign in</Link>
      </p>
    </form>
  );
}
