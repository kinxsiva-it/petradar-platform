'use client';

import { loadGoogleMaps } from '../../components/map/google-maps-loader';

export interface VeterinaryPlace {
  address: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  openNow: boolean | null;
  phone: string | null;
}

export interface PlaceSearchCenter {
  latitude: number;
  longitude: number;
}

const searchRadiusMeters = 8_000;

export async function findVeterinaryCare(apiKey: string, center: PlaceSearchCenter): Promise<VeterinaryPlace[]> {
  const maps = await loadGoogleMaps(apiKey);
  const { Place, SearchNearbyRankPreference } = await maps.importLibrary('places');
  const { places } = await Place.searchNearby({
    fields: ['displayName', 'formattedAddress', 'location'],
    includedPrimaryTypes: ['veterinary_care'],
    locationRestriction: {
      center: { lat: center.latitude, lng: center.longitude },
      radius: searchRadiusMeters,
    },
    maxResultCount: 20,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
  });

  return places.flatMap((place) => {
    if (!place.id || !place.displayName || !place.location) return [];
    return [{
      address: place.formattedAddress ?? 'Address unavailable',
      id: place.id,
      latitude: place.location.lat(),
      longitude: place.location.lng(),
      name: place.displayName,
      openNow: null,
      phone: null,
    }];
  });
}

export async function loadVeterinaryPlaceDetails(apiKey: string, place: VeterinaryPlace): Promise<VeterinaryPlace> {
  const maps = await loadGoogleMaps(apiKey);
  const { Place } = await maps.importLibrary('places');
  const detail = new Place({ id: place.id });
  await detail.fetchFields({ fields: ['displayName', 'formattedAddress', 'nationalPhoneNumber', 'regularOpeningHours', 'utcOffsetMinutes'] });
  const openNow = await detail.isOpen().catch(() => undefined);
  return {
    ...place,
    address: detail.formattedAddress ?? place.address,
    name: detail.displayName ?? place.name,
    openNow: openNow ?? place.openNow,
    phone: validTelephone(detail.nationalPhoneNumber) ? detail.nationalPhoneNumber : null,
  };
}

function validTelephone(value: string | undefined): value is string {
  return Boolean(value && /^[+()\d\s.-]{6,30}$/.test(value));
}
