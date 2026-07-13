import type { Metadata } from 'next';

import { CommunityMap } from '../../features/map/community-map';

export const metadata: Metadata = {
  title: 'Community Map',
  description: 'Explore privacy-safe approximate community animal sighting areas.',
};

export default function MapPage() {
  return <CommunityMap />;
}
