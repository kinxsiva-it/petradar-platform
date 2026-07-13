'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '../../features/auth/use-auth';
import { NotificationBell } from '../../features/notifications/notification-bell';
import { primaryNavigation, routes } from '../../lib/routes';
import { BrandMark } from './brand-mark';

export function SiteHeader() {
  const pathname = usePathname();
  const auth = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand-link" href={routes.home} aria-label="PetRadar home">
          <span className="brand-mark"><BrandMark /></span>
          <strong>PetRadar</strong>
          <small>Reuniting hearts</small>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}>{item.label}</Link>
          ))}
        </nav>
        <nav className="account-nav" aria-label="Account navigation">
          {auth.status === 'initializing' ? (
            <span className="account-summary" aria-live="polite">Checking session…</span>
          ) : auth.status === 'authenticated' && auth.user ? (
            <><NotificationBell /><details className="account-menu">
              <summary aria-label={`Open account menu for ${auth.user.displayName}`}>
                <span className="account-avatar" aria-hidden="true">{auth.user.displayName.charAt(0).toUpperCase()}</span>
                <span className="account-summary">{auth.user.displayName}</span>
              </summary>
              <div className="account-dropdown">
                <div className="account-identity"><strong>{auth.user.displayName}</strong><span>{auth.user.email}</span></div>
                <Link href={routes.profile}>Profile</Link>
                <Link href={routes.myReports}>My Reports</Link>
                <Link href={routes.myLostPets}>My Lost Pets</Link>
                <Link href={routes.matches}>Possible Matches</Link>
                <Link href={routes.notifications}>Notifications</Link>
                <Link href={routes.settings}>Settings</Link>
                <button type="button" onClick={() => void auth.logout()}>Sign out</button>
              </div>
            </details></>
          ) : (
            <><Link href={routes.login}>Log in</Link><Link className="register-link" href={routes.register}>Sign up</Link></>
          )}
        </nav>
      </div>
    </header>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
