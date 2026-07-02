import type {
  ApiAnimalCondition,
  ApiAnimalSpecies,
  ApiSightingLifecycleStatus,
  ApiUrgencyLevel,
  ApiVerificationStatus,
  SightingPhotoApiResponse,
} from '@petradar/frontend/sightings';

export type AdminSightingsSort =
  | 'OLDEST_WAITING_FIRST'
  | 'NEWEST_WAITING_FIRST'
  | 'HIGHEST_URGENCY'
  | 'MOST_RECENTLY_SEEN';

export interface AdminModerationHistoryItem {
  id: string;
  action: string;
  actorId: string | null;
  actorDisplayName: string | null;
  createdAt: string;
  previousVerificationStatus?: ApiVerificationStatus;
  newVerificationStatus?: ApiVerificationStatus;
  rejectionReason?: string;
}

export interface AdminModerationQueueItem {
  id: string;
  reference: string;
  species: ApiAnimalSpecies;
  condition: ApiAnimalCondition;
  urgency: ApiUrgencyLevel;
  seenAt: string;
  createdAt: string;
  waitingSeconds: number;
  verificationStatus: ApiVerificationStatus;
  lifecycleStatus: ApiSightingLifecycleStatus;
  thumbnailPhoto: SightingPhotoApiResponse | null;
  reporter: {
    id: string | null;
    displayName: string;
  };
}

export interface AdminModerationQueueResponse {
  items: AdminModerationQueueItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminModerationDetail
  extends Omit<AdminModerationQueueItem, 'thumbnailPhoto' | 'waitingSeconds'> {
  animalCount: number;
  color: string | null;
  pattern: string | null;
  collarStatus: string;
  description: string | null;
  updatedAt: string;
  photos: SightingPhotoApiResponse[];
  publicLocation: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  exactLocation: {
    latitude: number;
    longitude: number;
  };
  reporter: {
    id: string | null;
    email: string | null;
    displayName: string;
    phone: string | null;
  };
  moderationHistory: AdminModerationHistoryItem[];
  rejectionReason: string | null;
  canVerify: boolean;
  canReject: boolean;
}

export interface AdminModerationFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  species?: ApiAnimalSpecies;
  condition?: ApiAnimalCondition;
  verificationStatus?: ApiVerificationStatus;
  lifecycleStatus?: ApiSightingLifecycleStatus;
  urgency?: ApiUrgencyLevel;
  hasPhotos?: boolean;
  seenFrom?: string;
  seenTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: AdminSightingsSort;
}

export interface RejectSightingRequest {
  reason: string;
}

export interface MergeSightingRequest {
  targetSightingId: string;
}

export interface MergeSightingResponse {
  sourceSightingId: string;
  success: true;
  targetSightingId: string;
}

export interface ConvertSightingToRescueResponse {
  caseNumber: string;
  createdAt: string;
  id: string;
  severity: string;
  sightingId: string;
  status: string;
  summary: string;
}
