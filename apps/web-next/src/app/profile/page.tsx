import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../features/auth/authenticated-route';
import { ProfileView } from '../../features/profile/profile-view';
export const metadata:Metadata={title:'Profile',description:'View your authenticated PetRadar account.'};
export default function Page(){return <AuthenticatedRoute><ProfileView/></AuthenticatedRoute>;}
