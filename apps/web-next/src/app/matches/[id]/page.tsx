import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../../features/auth/authenticated-route';
import { MatchDetail } from '../../../features/matches/match-detail';
export const metadata:Metadata={title:'Match Details',description:'Review privacy-safe PetRadar match evidence.'};
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <AuthenticatedRoute><MatchDetail id={id}/></AuthenticatedRoute>;}
