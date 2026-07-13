import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../features/auth/authenticated-route';
import { MatchesOverview } from '../../features/matches/matches-overview';
export const metadata:Metadata={title:'Possible Matches',description:'Review privacy-safe possible matches for your lost pets.'};
export default function Page(){return <AuthenticatedRoute><MatchesOverview/></AuthenticatedRoute>;}
