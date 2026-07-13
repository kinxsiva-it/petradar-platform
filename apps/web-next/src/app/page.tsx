import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '../lib/routes';

export const metadata: Metadata = {
  title: 'Find and help animals near you',
  description: 'Find lost pets, report animal sightings, and help your community respond while PetRadar protects sensitive locations.',
};

export default function HomePage() {
  return (
    <div className="page-container home-page">
      <section className="hero-panel landing-hero">
        <div className="hero-copy">
          <span className="eyebrow">Community-powered animal care</span>
          <h1>Find, report, and help animals around you.</h1>
          <p>PetRadar connects neighbors, pet owners, and caring responders to bring animals home and get help where it is needed.</p>
          <div className="action-row">
            <Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link>
            <Link className="secondary-action" href={routes.lostPets}>Search lost pets</Link>
            <Link className="text-action" href={routes.map}>Explore the map</Link>
          </div>
        </div>
        <div className="map-preview" aria-label="Decorative approximate community map preview">
          <div className="map-grid-lines" />
          <div className="map-route-line" />
          <span className="preview-pin pin-one" aria-hidden="true">🐾</span>
          <span className="preview-pin pin-two" aria-hidden="true">♥</span>
          <span className="preview-pin pin-three" aria-hidden="true">!</span>
          <aside><strong>Privacy-safe discovery</strong><span>Community reports show approximate areas, never private pins.</span></aside>
        </div>
      </section>

      <section className="proof-grid" aria-label="How PetRadar helps">
        <article><strong>Community reports</strong><span>Share useful details quickly when an animal may need help.</span></article>
        <article><strong>Lost-pet search</strong><span>Browse real public posts and privacy-safe last-seen areas.</span></article>
        <article><strong>Possible matches</strong><span>Connect sightings with lost-pet cases for thoughtful review.</span></article>
        <article><strong>Privacy by design</strong><span>Exact locations and private contact details stay protected.</span></article>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <span className="eyebrow">Built for community care</span>
          <h2>A clearer path from noticing to helping</h2>
          <p>Share what you saw, look for a missing companion, and help information reach the right people.</p>
        </div>
        <div className="feature-grid">
          <article><span className="feature-icon" aria-hidden="true">1</span><h3>Report responsibly</h3><p>Add useful animal details while exact locations remain private.</p><Link href={routes.reportAnimal}>Start a report</Link></article>
          <article><span className="feature-icon" aria-hidden="true">2</span><h3>Search public posts</h3><p>Filter community lost-pet posts by name, species, and status.</p><Link href={routes.lostPets}>Browse lost pets</Link></article>
          <article><span className="feature-icon" aria-hidden="true">3</span><h3>Keep the community safe</h3><p>Follow practical guidance for sightings, contact, and animal welfare.</p><Link href={routes.communityGuidelines}>Read the guidelines</Link></article>
        </div>
      </section>

      <aside className="privacy-note">
        <strong>Helpful information without unsafe exposure.</strong>
        <span>Public pages use approximate areas only. Exact coordinates, private notes, and reporter contact details remain restricted.</span>
      </aside>
    </div>
  );
}
