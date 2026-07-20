import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../features/auth/authenticated-route';
import { SettingsView } from '../../features/profile/settings-view';
export const metadata:Metadata={title:'Settings',description:'Review available PetRadar account settings.'};
export default function Page(){return <AuthenticatedRoute><SettingsView/></AuthenticatedRoute>;}
