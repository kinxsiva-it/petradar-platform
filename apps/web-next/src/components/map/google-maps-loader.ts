'use client';

export interface GoogleGeocoderResult {
  formatted_address?: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
}

export interface GooglePlaceResult {
  geometry?: { location?: { lat(): number; lng(): number } };
  name?: string;
  opening_hours?: { open_now?: boolean };
  place_id?: string;
  vicinity?: string;
}

export interface GooglePlaceDetails extends GooglePlaceResult {
  formatted_address?: string;
  formatted_phone_number?: string;
}

export interface GooglePlace {
  displayName?: string;
  formattedAddress?: string;
  id: string;
  location?: { lat(): number; lng(): number };
  nationalPhoneNumber?: string;
  fetchFields(request: { fields: readonly string[] }): Promise<void>;
  isOpen(): Promise<boolean | undefined>;
}

export interface GooglePlacePrediction {
  mainText?: { text: string };
  placeId: string;
  secondaryText?: { text: string };
  text: { text: string };
  toPlace(): GooglePlace;
}

export interface GoogleAutocompleteSuggestion {
  placePrediction?: GooglePlacePrediction;
}

export type GoogleAutocompleteSessionToken = object;

export interface GooglePlacesLibrary {
  AutocompleteSessionToken: new () => GoogleAutocompleteSessionToken;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: {
      includedRegionCodes: readonly string[];
      input: string;
      origin: { lat: number; lng: number };
      region: string;
      sessionToken: GoogleAutocompleteSessionToken;
    }): Promise<{ suggestions: readonly GoogleAutocompleteSuggestion[] }>;
  };
  Place: {
    new (options: { id: string }): GooglePlace;
    searchNearby(request: {
      fields: readonly string[];
      includedPrimaryTypes: readonly string[];
      locationRestriction: { center: { lat: number; lng: number }; radius: number };
      maxResultCount: number;
      rankPreference: string;
    }): Promise<{ places: readonly GooglePlace[] }>;
  };
  SearchNearbyRankPreference: { POPULARITY: string };
}

export interface GoogleMapApi {
  Map: new (element: HTMLElement, options: { center: { lat: number; lng: number }; mapTypeControl: boolean; streetViewControl: boolean; zoom: number }) => { addListener(name: string, handler: () => void): void; getCenter(): { lat(): number; lng(): number } | null; getZoom(): number | undefined };
  Circle: new (options: { center: { lat: number; lng: number }; clickable: boolean; fillColor: string; fillOpacity: number; map: unknown; radius: number; strokeColor: string; strokeOpacity?: number; strokeWeight: number }) => { addListener(name: string, handler: () => void): void; setOptions(options: { fillOpacity: number; strokeOpacity: number; strokeWeight?: number }): void; setRadius(radius: number): void };
  Marker: new (options: { icon: { scaledSize: unknown; url: string }; map: unknown; position: { lat: number; lng: number }; title: string; zIndex: number }) => { addListener(name: string, handler: () => void): void };
  Size: new (width: number, height: number) => unknown;
  Geocoder: new () => {
    geocode(
      request: { address?: string; placeId?: string },
      callback: (results: readonly GoogleGeocoderResult[] | null, status: string) => void,
    ): void;
  };
  importLibrary(name: 'places'): Promise<GooglePlacesLibrary>;
  places: {
    PlacesService: new (element: HTMLDivElement) => {
      getDetails(request: { fields: readonly string[]; placeId: string }, callback: (result: GooglePlaceDetails | null, status: string) => void): void;
      nearbySearch(request: { keyword: string; location: { lat: number; lng: number }; radius: number; type: string }, callback: (results: readonly GooglePlaceResult[] | null, status: string) => void): void;
    };
    PlacesServiceStatus: { OK: string; ZERO_RESULTS: string };
  };
  event: { trigger(target: unknown, name: string): void };
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
    google?: { maps: GoogleMapApi };
    petradarGoogleMapsReady?: () => void;
  }
}

let googleLoader: Promise<GoogleMapApi> | null = null;

export function loadGoogleMaps(key: string): Promise<GoogleMapApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleLoader) return googleLoader;

  googleLoader = new Promise((resolve, reject) => {
    const callback = 'petradarGoogleMapsReady';
    window.petradarGoogleMapsReady = () => {
      delete window.petradarGoogleMapsReady;
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps unavailable.'));
    };
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      googleLoader = null;
      reject(new Error('Google Maps failed to load.'));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${callback}`;
    document.head.append(script);
  });

  return googleLoader;
}
