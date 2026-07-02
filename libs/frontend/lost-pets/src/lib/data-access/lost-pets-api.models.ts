export type ApiAnimalSpecies = 'CAT' | 'DOG' | 'OTHER';
export type ApiLostPetSex = 'FEMALE' | 'MALE' | 'UNKNOWN';
export type ApiLostPetStatus = 'CLOSED' | 'LOST' | 'POSSIBLE_MATCH' | 'REUNITED';
export type ApiMatchLevel = 'HIGH' | 'LOW' | 'MEDIUM';
export type ApiMatchReviewStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';

export interface PublicLocationApiResponse {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface LostPetApiResponse {
  age: string | null;
  breed: string | null;
  collarDescription: string | null;
  color: string | null;
  contactMethod?: string | null;
  createdAt: string;
  description: string | null;
  exactLocation?: {
    latitude: number;
    longitude: number;
  };
  id: string;
  lastSeenAt: string;
  microchipped?: boolean;
  name: string;
  ownerId?: string;
  pattern: string | null;
  photoUrls: string[];
  publicLocation: PublicLocationApiResponse;
  rewardCents: number | null;
  sex: ApiLostPetSex;
  species: ApiAnimalSpecies;
  status: ApiLostPetStatus;
  updatedAt: string;
}

export interface CreateLostPetRequest {
  age?: string;
  breed?: string;
  collarDescription?: string;
  color?: string;
  contactMethod?: string;
  description?: string;
  lastSeenAt: string;
  latitude: number;
  longitude: number;
  microchipped?: boolean;
  name: string;
  pattern?: string;
  photoUrls?: string[];
  rewardCents?: number;
  sex?: ApiLostPetSex;
  species: ApiAnimalSpecies;
}

export interface UpdateLostPetRequest extends Partial<CreateLostPetRequest> {
  status?: ApiLostPetStatus;
}

export interface LostPetListFilters {
  lastSeenFrom?: string;
  lastSeenTo?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  species?: ApiAnimalSpecies;
  status?: ApiLostPetStatus;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MatchApiResponse {
  distanceMeters: number | null;
  id: string;
  level: ApiMatchLevel;
  lostPet: {
    id: string;
    name: string;
  };
  matchedAt: string;
  reasons: string[];
  rejectionReason: string | null;
  reviewStatus: ApiMatchReviewStatus;
  reviewedAt: string | null;
  score: number;
  sighting: {
    condition: string;
    id: string;
    publicLocation: PublicLocationApiResponse;
    seenAt: string;
    species: ApiAnimalSpecies;
  };
}

export interface LostPetMatchesResponse {
  items: MatchApiResponse[];
}

export interface MatchListFilters {
  page?: number;
  pageSize?: number;
  status?: ApiMatchReviewStatus;
}

export interface RejectMatchRequest {
  reason?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string | string[];
  path: string;
  requestId: string | null;
  statusCode: number;
  timestamp: string;
}
