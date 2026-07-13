import Link from 'next/link';

import { routes } from '../../../lib/routes';

export default function LostPetNotFound() {
  return (
    <div className="page-container state-page">
      <section className="empty-state">
        <span aria-hidden="true">🐾</span>
        <h1>Lost-pet post not found</h1>
        <p>This public post may have been removed, closed, or the link may be incorrect.</p>
        <Link className="primary-action" href={routes.lostPets}>Browse lost pets</Link>
      </section>
    </div>
  );
}
