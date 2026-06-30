export type AnimalSpecies = 'Cat' | 'Dog' | 'Other';
export type AnimalCondition =
  | 'Normal stray'
  | 'Injured'
  | 'Needs rescue'
  | 'Newborn litter'
  | 'Possible lost pet'
  | 'Sick'
  | 'Pregnant'
  | 'Aggressive'
  | 'Unknown';
export type CollarStatus =
  | 'No collar'
  | 'Red collar with bell'
  | 'Blue collar'
  | 'Unknown'
  | 'Other';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Emergency';
export type VerificationStatus =
  | 'Pending'
  | 'Verified'
  | 'Community verified'
  | 'Needs review'
  | 'Rejected'
  | 'Duplicate';
export type PublicSightingStatus =
  | 'Sighting'
  | 'Possible match'
  | 'Needs rescue'
  | 'Reunited'
  | 'Closed';
export type LostPetStatus = 'Active' | 'Possible match' | 'Reunited' | 'Closed';

export interface ApproximatePublicLocation {
  label: string;
  area: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PublicSighting {
  id: string;
  reference: string;
  species: AnimalSpecies;
  title: string;
  condition: AnimalCondition;
  color: string;
  pattern?: string;
  collarStatus: CollarStatus;
  description: string;
  photoUrls: string[];
  approximateLocation: ApproximatePublicLocation;
  seenAt: string;
  distanceLabel: string;
  urgency: UrgencyLevel;
  verificationStatus: VerificationStatus;
  status: PublicSightingStatus;
  reporterLabel: string;
  matchConfidence?: number;
}

export interface PublicLostPet {
  id: string;
  reference: string;
  petName: string;
  species: AnimalSpecies;
  breed?: string;
  sex?: string;
  ageDescription?: string;
  color: string;
  pattern?: string;
  collarDescription?: string;
  description: string;
  photoUrls: string[];
  approximateLastSeenLocation: ApproximatePublicLocation;
  lastSeenAt: string;
  status: LostPetStatus;
  possibleMatchCount: number;
  contactPreference: string;
  rewardLabel: string;
}

export interface DiscoveryFilters {
  query: string;
  species: 'All' | AnimalSpecies;
  condition: 'All' | AnimalCondition;
  status: 'All' | PublicSightingStatus | LostPetStatus;
  verification: 'All' | VerificationStatus;
}
