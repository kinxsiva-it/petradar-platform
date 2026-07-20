import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '../../features/auth/login-form';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to manage your PetRadar reports, lost pets, and possible matches.',
};

export default function LoginPage() {
  return (
    <div className="page-container auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to PetRadar</h1>
          <p>Manage your community reports, lost-pet posts, and possible matches.</p>
          <aside className="privacy-note compact-note">
            <strong>Your session stays protected.</strong>
            <span>PetRadar keeps refresh credentials in a secure HttpOnly cookie.</span>
          </aside>
        </div>
        <Suspense fallback={<div className="auth-form loading-form">Preparing sign in…</div>}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
