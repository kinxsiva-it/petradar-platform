import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { routes } from '../lib/routes';

export const metadata: Metadata = {
  title: 'Find and help animals near you',
  description:
    'Find lost pets, report animal sightings, and help your community respond while PetRadar protects sensitive locations.',
};

const proofItems = [
  {
    icon: 'community',
    title: 'Community reports',
    text: 'Share sightings and useful details to help animals in need.',
  },
  {
    icon: 'search',
    title: 'Lost-pet search',
    text: 'Browse public posts and privacy-safe last-seen areas.',
  },
  {
    icon: 'match',
    title: 'Possible matches',
    text: 'Connect sightings with lost-pet cases for thoughtful review.',
  },
  {
    icon: 'shield',
    title: 'Privacy by design',
    text: 'Exact locations and private contact details stay protected.',
  },
] as const;

const steps = [
  {
    number: '1',
    image: '/landing/report-phone.png',
    title: 'Report what you see',
    text: 'Add useful details and an approximate public area to help others find the animal.',
  },
  {
    number: '2',
    image: '/landing/discover-map.png',
    title: 'Discover nearby reports',
    text: 'Explore public sightings and lost-pet posts while private pins stay protected.',
  },
  {
    number: '3',
    image: '/landing/reconnect.png',
    title: 'Help animals reconnect',
    text: 'Your report could be the missing piece that helps bring a companion home.',
  },
] as const;

export default function HomePage() {
  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <span className="landing-decoration landing-paw-one" aria-hidden="true"><Icon name="paw" /></span>
        <span className="landing-decoration landing-paw-two" aria-hidden="true"><Icon name="paw" /></span>
        <span className="landing-decoration landing-heart-one" aria-hidden="true"><Icon name="heart" /></span>
        <div className="landing-hero-copy">
          <span className="landing-kicker"><Icon name="heart" /> COMMUNITY-POWERED ANIMAL CARE</span>
          <h1 id="landing-title">Find and help animals near you</h1>
          <p>
            Together, we reunite lost pets, help strays, and keep animals safe in our
            community.
          </p>
          <div className="landing-actions">
            <Link className="primary-action landing-primary-action" href={routes.reportAnimal}>
              <Icon name="paw" /> Report an animal
            </Link>
            <Link className="secondary-action landing-secondary-action" href={routes.lostPetNew}>
              <Icon name="heart" /> Report lost pet
            </Link>
            <Link className="landing-map-link" href={routes.map}>
              Explore the map <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="landing-privacy-line">
            <Icon name="shield" /> Public locations are approximate only to protect privacy.
          </p>
        </div>
        <div className="landing-hero-visual">
          <span className="landing-visual-blob" aria-hidden="true" />
          <Image
            alt="A friendly golden retriever puppy sitting beside a cat"
            className="landing-hero-animals"
            height={1086}
            priority
            sizes="(max-width: 760px) 92vw, 48vw"
            src="/images/landing/hero-dog-and-cat-transparent.png"
            width={1448}
          />
        </div>
      </section>

      <section className="landing-proof" aria-label="How PetRadar helps">
        {proofItems.map((item) => (
          <article key={item.title}>
            <span className={`landing-proof-icon landing-proof-${item.icon}`} aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <div><h2>{item.title}</h2><p>{item.text}</p></div>
          </article>
        ))}
      </section>

      <section className="landing-how" aria-labelledby="how-title">
        <div className="landing-section-heading">
          <span aria-hidden="true"><Icon name="paw" /></span>
          <div><span className="eyebrow">Simple community action</span><h2 id="how-title">How it works</h2></div>
          <span aria-hidden="true"><Icon name="paw" /></span>
        </div>
        <div className="landing-steps">
          {steps.map((step, index) => (
            <article key={step.number}>
              <span className={`landing-step-number landing-step-${step.number}`}>{step.number}</span>
              <div className="landing-step-image">
                <Image alt="" fill sizes="(max-width: 760px) 35vw, 11rem" src={step.image} />
              </div>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
              {index < steps.length - 1 ? <span className="landing-step-arrow" aria-hidden="true">→</span> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-discovery" aria-labelledby="discovery-title">
        <div className="landing-discovery-heading">
          <div>
            <span className="eyebrow">Privacy-safe discovery</span>
            <h2 id="discovery-title">See where the community can help</h2>
            <p>Explore approximate areas and public reports without exposing anyone&apos;s private pin.</p>
          </div>
          <Link className="secondary-action" href={routes.map}>View full map <span aria-hidden="true">→</span></Link>
        </div>
        <div className="landing-discovery-layout">
          <div className="landing-map-preview" aria-label="Illustration of privacy-safe community report areas">
            <span className="landing-map-road road-one" aria-hidden="true" />
            <span className="landing-map-road road-two" aria-hidden="true" />
            <span className="landing-map-water" aria-hidden="true" />
            <span className="landing-map-area" aria-hidden="true" />
            <MapPin className="map-pin-dog" label="Lost pet area" tone="orange" icon="paw" />
            <MapPin className="map-pin-cat" label="Cat sighting area" tone="purple" icon="cat" />
            <MapPin className="map-pin-report" label="Community report area" tone="teal" icon="community" />
            <span className="landing-you-marker"><span />You</span>
            <div className="landing-map-legend" aria-hidden="true">
              <span><i className="legend-orange" />Lost pet</span>
              <span><i className="legend-purple" />Sighting</span>
              <span><i className="legend-teal" />Community report</span>
            </div>
          </div>
          <div className="landing-discovery-cards">
            <article><span><Icon name="search" /></span><div><h3>Browse lost pets</h3><p>Search public posts by species, status, or a detail you remember.</p></div></article>
            <article><span><Icon name="match" /></span><div><h3>Review possible matches</h3><p>Pet owners can compare privacy-safe evidence from community sightings.</p></div></article>
            <article><span><Icon name="guidelines" /></span><div><h3>Help responsibly</h3><p>Use practical safety guidance before approaching or contacting anyone.</p></div></article>
            <Link className="landing-inline-link" href={routes.lostPets}>Browse public lost-pet posts <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="landing-privacy" aria-labelledby="privacy-title">
        <span className="landing-privacy-shield" aria-hidden="true"><Icon name="shield" /></span>
        <div>
          <span className="eyebrow">Privacy and safety come first</span>
          <h2 id="privacy-title">Helpful information, never unsafe exposure</h2>
          <p>Public maps show approximate areas. Exact locations, contact details, and private messages are shared only through authorized experiences.</p>
        </div>
        <ul>
          <li><Icon name="pin" /><span><strong>Approximate areas only</strong> on public maps</span></li>
          <li><Icon name="shield" /><span><strong>Private contacts stay protected</strong> from public pages</span></li>
          <li><Icon name="heart" /><span><strong>You stay in control</strong> of the information you share</span></li>
        </ul>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-cta-title">
        <span className="landing-final-paw" aria-hidden="true"><Icon name="paw" /></span>
        <div><span className="eyebrow">Every report can change a life</span><h2 id="landing-cta-title">Ready to help an animal nearby?</h2></div>
        <div className="landing-actions">
          <Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link>
          <Link className="secondary-action" href={routes.communityGuidelines}>Read safety guidelines</Link>
        </div>
      </section>
    </div>
  );
}

type IconName = 'cat' | 'community' | 'guidelines' | 'heart' | 'match' | 'paw' | 'pin' | 'search' | 'shield';

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    cat: <><path d="M6 10 5 4l4 3a8 8 0 0 1 6 0l4-3-1 6a7 7 0 1 1-12 0Z"/><path d="M9 14h.01M15 14h.01M10 17c1.2 1 2.8 1 4 0"/></>,
    community: <><circle cx="8" cy="9" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M3 20c.5-4 2.4-6 5-6s4.5 2 5 6M14 14c3.7-.3 5.8 1.7 6.4 5"/></>,
    guidelines: <><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,
    heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>,
    match: <><path d="M7 7h10M7 17h10"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="m9 9 6 6"/></>,
    paw: <><ellipse cx="12" cy="16.5" rx="5" ry="4"/><circle cx="6" cy="11" r="2"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="7" r="2"/><circle cx="18" cy="11" r="2"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    shield: <><path d="M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function MapPin({ className, icon, label, tone }: { className: string; icon: IconName; label: string; tone: string }) {
  return <span aria-label={label} className={`landing-map-pin ${className} map-tone-${tone}`} role="img"><Icon name={icon} /></span>;
}
