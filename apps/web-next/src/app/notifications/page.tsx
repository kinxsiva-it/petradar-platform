import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../features/auth/authenticated-route';
import { NotificationsPage } from '../../features/notifications/notifications-page';
export const metadata:Metadata={title:'Notifications',description:'Review updates about your PetRadar activity.'};
export default function Page(){return <AuthenticatedRoute><NotificationsPage/></AuthenticatedRoute>;}
