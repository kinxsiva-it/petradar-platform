import Link from 'next/link';

import { routes } from '../../lib/routes';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>Community-powered care for animals and the people looking out for them.</span>
        <Link href={routes.communityGuidelines}>Community Guidelines</Link>
      </div>
    </footer>
  );
}
