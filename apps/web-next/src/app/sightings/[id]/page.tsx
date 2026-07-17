import type { Metadata } from 'next';

import { PublicSightingDetail } from '../../../features/sightings/public-sighting-detail';

export const metadata: Metadata = {
  title: 'Public Sighting',
  description: 'View privacy-safe public animal sighting details.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicSightingDetail id={id} />;
}
