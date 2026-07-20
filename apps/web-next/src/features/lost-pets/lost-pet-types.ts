export type AnimalSpecies = 'CAT' | 'DOG' | 'OTHER';
export type LostPetSex = 'FEMALE' | 'MALE' | 'UNKNOWN';
export type LostPetStatus = 'CLOSED' | 'LOST' | 'POSSIBLE_MATCH' | 'REUNITED';

export interface PublicLostPet {
  age: string | null;
  approximateRadiusMeters: number;
  breed: string | null;
  collarDescription: string | null;
  color: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  lastSeenAt: string;
  name: string;
  pattern: string | null;
  photoUrls: string[];
  rewardCents: number | null;
  sex: LostPetSex;
  species: AnimalSpecies;
  status: LostPetStatus;
  updatedAt: string;
}

export interface PublicLostPetPage {
  items: PublicLostPet[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LostPetListFilters {
  lastSeenFrom?: string;
  lastSeenTo?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  species?: AnimalSpecies;
  status?: LostPetStatus;
}
