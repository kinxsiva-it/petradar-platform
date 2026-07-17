import type { Metadata } from 'next';

import { AuthenticatedRoute } from '../../../../../features/auth/authenticated-route';
import { PetMatches } from '../../../../../features/matches/pet-matches';

export const metadata: Metadata = {
  title: 'Lost Pet Matches',
  description: 'Review matches for one of your lost pets.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthenticatedRoute>
      <PetMatches lostPetId={id} />
    </AuthenticatedRoute>
  );
}
