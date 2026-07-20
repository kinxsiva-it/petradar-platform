import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '../../lib/routes';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'Learn how to report animals, protect location privacy, and help responsibly with PetRadar.',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="page-container guidelines-page">
      <header className="page-heading guidelines-heading">
        <div><span className="eyebrow">Safe, respectful action</span><h1>Community Guidelines</h1><p>PetRadar works best when reports are accurate, privacy-aware, and centered on animal welfare.</p></div>
        <Link className="primary-action" href={routes.reportAnimal}>Report an animal</Link>
      </header>

      <section className="guideline-grid">
        <Guideline number="01" title="Observe before approaching">Keep a calm distance. Do not chase, corner, feed, or handle an unfamiliar animal when doing so could put you or the animal at risk.</Guideline>
        <Guideline number="02" title="Share accurate details">Describe what you genuinely observed, including appearance, condition, time, and behavior. Avoid guesses presented as facts.</Guideline>
        <Guideline number="03" title="Protect private locations">Use the private location tools when reporting. PetRadar creates an approximate public area so homes, shelters, and vulnerable animals are not pinpointed.</Guideline>
        <Guideline number="04" title="Respect people and privacy">Do not publish phone numbers, addresses, private messages, identity documents, or personal accusations in public descriptions.</Guideline>
        <Guideline number="05" title="Coordinate responsibly">Use report updates and possible matches to share helpful evidence. Do not impersonate owners, rescuers, authorities, or veterinary professionals.</Guideline>
        <Guideline number="06" title="Escalate urgent danger">If an animal or person faces immediate danger, contact appropriate local emergency, animal welfare, or veterinary services. PetRadar is not an emergency dispatcher.</Guideline>
      </section>

      <section className="conduct-panel">
        <div><span className="eyebrow">A caring community</span><h2>Be kind, patient, and constructive</h2></div>
        <p>Harassment, threats, discrimination, fraudulent reports, graphic exploitation, and attempts to reveal private locations are not acceptable. Focus discussion on useful next steps and the animal's safety.</p>
      </section>

      <aside className="privacy-note"><strong>When in doubt, share less publicly.</strong><span>Exact coordinates, private contact information, and sensitive location notes belong only in protected workflows.</span></aside>
    </div>
  );
}

function Guideline({ children, number, title }: { children: React.ReactNode; number: string; title: string }) {
  return <article><span className="guideline-number">{number}</span><h2>{title}</h2><p>{children}</p></article>;
}
