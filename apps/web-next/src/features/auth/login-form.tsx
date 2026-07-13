'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { routes, safeReturnUrl } from '../../lib/routes';
import { authErrorMessage } from './auth-error';
import { useAuth } from './use-auth';

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@') || password.length < 1) {
      setError('Enter your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await auth.login({ email: email.trim(), password });
      router.replace(safeReturnUrl(searchParams.get('returnUrl')) ?? routes.myReports);
    } catch (submitError) {
      setError(authErrorMessage(submitError, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}

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
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <button className="primary-action form-submit" disabled={submitting} type="submit">
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="form-alternative">
        New to PetRadar? <Link href={routes.register}>Create an account</Link>
      </p>
    </form>
  );
}
