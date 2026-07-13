import Link from 'next/link';

import { routes } from '../lib/routes';

interface RouteShellProps {
  description: string;
  eyebrow: string;
  phase: 2 | 3 | 4;
  title: string;
}

export function RouteShell({ description, eyebrow, phase, title }: RouteShellProps) {
  return (
    <div className="page-container route-page">
      <section className="route-panel">
        <div className="route-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <span className="phase-badge">Feature migration planned for Phase {phase}</span>
        </div>
        <nav className="route-links" aria-label="Foundation route links">
          <Link className="secondary-action" href={routes.home}>
            Foundation home
          </Link>
          <Link className="primary-action" href={routes.map}>
            Map route
          </Link>
        </nav>
      </section>
    </div>
  );
}
