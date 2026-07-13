'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { routes } from '../../lib/routes';
import { useAuth } from './use-auth';

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'anonymous') {
      router.replace(`${routes.login}?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [auth.status, pathname, router]);

  if (auth.status === 'initializing') {
    return <ProtectedRouteState title="Restoring your secure session…" />;
  }

  if (auth.status === 'anonymous') {
    return <ProtectedRouteState title="Redirecting to sign in…" />;
  }

  return children;
}

function ProtectedRouteState({ title }: { title: string }) {
  return (
    <div className="page-container state-page" aria-live="polite">
      <section className="loading-state protected-route-state">
        <span className="loading-pulse" />
        <p>{title}</p>
      </section>
    </div>
  );
}
