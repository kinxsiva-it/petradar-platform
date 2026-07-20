import type { Metadata } from 'next';
import { AuthenticatedRoute } from '../../../../features/auth/authenticated-route';
import { LostPetForm } from '../../../../features/lost-pets/lost-pet-form';
export const metadata:Metadata={title:'Edit Lost Pet',description:'Update your private owner lost-pet post.'};
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <AuthenticatedRoute><LostPetForm id={id}/></AuthenticatedRoute>;}
