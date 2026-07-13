import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterForm } from '../../features/auth/register-form';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Join PetRadar to report animals and help reunite lost pets with their families.',
};

export default function RegisterPage() {
  return (
    <div className="page-container auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <span className="eyebrow">Join the community</span>
          <h1>Create your PetRadar account</h1>
          <p>Report animals, follow lost-pet cases, and help your neighborhood respond responsibly.</p>
          <aside className="privacy-note compact-note">
            <strong>Community-first by design.</strong>
            <span>Public pages use approximate areas and never reveal your private contact details.</span>
          </aside>
        </div>
        <Suspense fallback={<div className="auth-form loading-form">Preparing registration…</div>}>
          <RegisterForm />
        </Suspense>
      </section>
    </div>
  );
}
