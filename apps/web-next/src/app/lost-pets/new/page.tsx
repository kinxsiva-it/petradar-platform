import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../../features/auth/authenticated-route';
import { LostPetForm } from '../../../features/lost-pets/lost-pet-form';
export const metadata:Metadata={title:'Post a Lost Pet',description:'Create a privacy-aware lost-pet post on PetRadar.'};
export default function Page(){return <AuthenticatedRoute><LostPetForm/></AuthenticatedRoute>;}
