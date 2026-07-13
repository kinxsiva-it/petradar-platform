import 'leaflet/dist/leaflet.css';
import './global.css';
import type { Metadata } from 'next';

import { SiteFooter } from '../components/layout/site-footer';
import { SiteHeader } from '../components/layout/site-header';
import { AuthProvider } from '../features/auth/auth-provider';
import { NotificationsProvider } from '../features/notifications/notifications-provider';

export const metadata: Metadata = {
  title: {
    default: 'PetRadar',
    template: '%s | PetRadar',
  },
  description: 'Community-powered animal sighting, lost-pet, and rescue coordination.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationsProvider>
            <div className="site-shell">
              <SiteHeader />
              <main className="site-main">{children}</main>
              <SiteFooter />
            </div>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
