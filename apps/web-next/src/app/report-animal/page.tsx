import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../features/auth/authenticated-route';
import { ReportAnimalWizard } from '../../features/sightings/report-animal-wizard';
export const metadata:Metadata={title:'Report an Animal',description:'Submit a private-location-aware animal sighting to PetRadar.'};
export default function Page(){return <AuthenticatedRoute><ReportAnimalWizard/></AuthenticatedRoute>;}
