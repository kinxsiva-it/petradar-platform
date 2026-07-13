import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../../features/auth/authenticated-route';
import { MyReports } from '../../../features/sightings/my-reports';
export const metadata:Metadata={title:'My Reports',description:'Manage your PetRadar animal reports.'};
export default function Page(){return <AuthenticatedRoute><MyReports/></AuthenticatedRoute>;}
