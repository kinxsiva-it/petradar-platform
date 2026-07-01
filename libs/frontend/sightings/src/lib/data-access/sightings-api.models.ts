export type ApiAnimalSpecies = 'CAT' | 'DOG' | 'OTHER';
export type ApiAnimalCondition =
  | 'NORMAL_STRAY'
  | 'INJURED'
  | 'NEEDS_RESCUE'
  | 'NEWBORN_LITTER'
  | 'POSSIBLE_LOST_PET'
  | 'SICK'
  | 'PREGNANT'
  | 'AGGRESSIVE'
  | 'UNKNOWN';
export type ApiCollarStatus =
  | 'NO_COLLAR'
  | 'RED_COLLAR_WITH_BELL'
  | 'BLUE_COLLAR'
  | 'UNKNOWN'
  | 'OTHER';
export type ApiUrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type ApiSightingLifecycleStatus =
  | 'SIGHTING'
  | 'POSSIBLE_MATCH'
  | 'NEEDS_RESCUE'
  | 'REUNITED'
  | 'CLOSED';
export type ApiVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'COMMUNITY_VERIFIED'
  | 'NEEDS_REVIEW'
  | 'REJECTED'
  | 'DUPLICATE';

export interface CreateSightingRequest {
  species: ApiAnimalSpecies;
  count: number;
  color?: string;
  pattern?: string;
  collarStatus?: ApiCollarStatus;
  condition?: ApiAnimalCondition;
  description?: string;
  seenAt: string;
  urgency?: ApiUrgencyLevel;
  latitude: number;
  longitude: number;
}

export type UpdateSightingRequest = Partial<CreateSightingRequest>;

export interface PublicSightingLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PublicSightingApiResponse {
  id: string;
  species: ApiAnimalSpecies;
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: ApiCollarStatus;
  condition: ApiAnimalCondition;
  description: string | null;
  seenAt: string;
  urgency: ApiUrgencyLevel;
  lifecycleStatus: ApiSightingLifecycleStatus;
  verificationStatus: ApiVerificationStatus;
  publicLocation: PublicSightingLocation;
  photos: SightingPhotoApiResponse[];
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
}

export interface SightingPhotoApiResponse {
  id: string;
  url: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface OwnerSightingApiResponse extends PublicSightingApiResponse {
  editable: boolean;
  exactLocation?: {
    latitude: number;
    longitude: number;
  };
  rejectionReason?: string;
}

export interface UploadSightingPhotosResponse {
  photos: SightingPhotoApiResponse[];
}

export interface DeleteSightingPhotoResponse {
  success: true;
}

export interface PaginatedSightingsApiResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SightingListFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  species?: ApiAnimalSpecies;
  condition?: ApiAnimalCondition;
  lifecycleStatus?: ApiSightingLifecycleStatus;
  verificationStatus?: ApiVerificationStatus;
  urgency?: ApiUrgencyLevel;
  seenFrom?: string;
  seenTo?: string;
  createdFrom?: string;
  createdTo?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface ApiValidationError {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  requestId: string | null;
  timestamp: string;
}
