export type AnimalSpecies = 'CAT' | 'DOG' | 'OTHER';
export type AnimalCondition = 'NORMAL_STRAY' | 'INJURED' | 'NEEDS_RESCUE' | 'NEWBORN_LITTER' | 'POSSIBLE_LOST_PET' | 'SICK' | 'PREGNANT' | 'AGGRESSIVE' | 'UNKNOWN';
export type CollarStatus = 'NO_COLLAR' | 'RED_COLLAR_WITH_BELL' | 'BLUE_COLLAR' | 'UNKNOWN' | 'OTHER';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type SightingLifecycleStatus = 'SIGHTING' | 'POSSIBLE_MATCH' | 'NEEDS_RESCUE' | 'REUNITED' | 'CLOSED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'COMMUNITY_VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'DUPLICATE';

export interface OwnerSighting {
  animalCount: number;
  collarStatus: CollarStatus;
  color: string | null;
  condition: AnimalCondition;
  description: string | null;
  editable: boolean;
  id: string;
  lifecycleStatus: SightingLifecycleStatus;
  pattern: string | null;
  photoUrls: string[];
  publicRadiusMeters: number;
  rejectionReason: string | null;
  seenAt: string;
  species: AnimalSpecies;
  urgency: UrgencyLevel;
  verificationStatus: VerificationStatus;
}

export interface OwnerSightingPage {
  items: OwnerSighting[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateSightingRequest {
  collarStatus?: CollarStatus;
  color?: string;
  condition: AnimalCondition;
  count: number;
  description?: string;
  latitude: number;
  longitude: number;
  pattern?: string;
  seenAt: string;
  species: AnimalSpecies;
  urgency: UrgencyLevel;
}
