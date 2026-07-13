import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../../features/auth/authenticated-route';
import { MyLostPets } from '../../../features/lost-pets/my-lost-pets';
export const metadata:Metadata={title:'My Lost Pets',description:'Manage your PetRadar lost-pet posts.'};
export default function Page(){return <AuthenticatedRoute><MyLostPets/></AuthenticatedRoute>;}
