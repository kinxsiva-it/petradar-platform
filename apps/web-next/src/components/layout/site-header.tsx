'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useAuth } from '../../features/auth/use-auth';
import { NotificationBell } from '../../features/notifications/notification-bell';
import { primaryNavigation, routes } from '../../lib/routes';
import { BrandMark } from './brand-mark';

export function SiteHeader() {
  const pathname = usePathname();
  const auth = useAuth();
  const accountNavRef = useRef<HTMLElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!notificationOpen && !accountOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !accountNavRef.current?.contains(target)) {
        setNotificationOpen(false);
        setAccountOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen, notificationOpen]);

  function changeNotificationOpen(next: boolean) {
    setNotificationOpen(next);
    if (next) setAccountOpen(false);
  }

  function handleAccountToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const next = event.currentTarget.open;
    setAccountOpen(next);
    if (next) setNotificationOpen(false);
  }

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
            <Link
              aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
              className="primary-nav-link"
              href={item.href}
              key={item.href}
            >
              <NavigationIcon href={item.href} />
              <span>{item.label}</span>
              <span aria-hidden="true" className="primary-nav-dot" />
            </Link>
          ))}
        </nav>
        <nav ref={accountNavRef} className="account-nav" aria-label="Account navigation">
          {auth.status === 'initializing' ? (
            <span className="account-summary" aria-live="polite">Checking session…</span>
          ) : auth.status === 'authenticated' && auth.user ? (
            <><NotificationBell open={notificationOpen} onOpenChange={changeNotificationOpen} /><details className="account-menu" open={accountOpen} onToggle={handleAccountToggle}>
              <summary aria-label={`Open account menu for ${auth.user.displayName}`}>
                <span className="account-avatar" aria-hidden="true">{auth.user.displayName.charAt(0).toUpperCase()}</span>
                <span className="account-summary">{auth.user.displayName}</span>
                <AccountChevron />
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

function NavigationIcon({ href }: { href: string }) {
  const paths: Record<string, ReactNode> = {
    [routes.map]: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    [routes.lostPets]: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    [routes.matches]: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    [routes.reportAnimal]: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8" /><path d="M8 12h8" /></>,
    [routes.communityGuidelines]: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5Z" /><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5Z" /></>,
  };

  return (
    <svg aria-hidden="true" className="primary-nav-icon" fill="none" focusable="false" viewBox="0 0 24 24">
      {paths[href]}
    </svg>
  );
}

function AccountChevron() {
  return (
    <svg aria-hidden="true" className="account-chevron" fill="none" focusable="false" viewBox="0 0 24 24">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}
