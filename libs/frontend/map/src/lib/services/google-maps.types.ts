export interface GoogleMapsLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapsLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleMapsListener {
  remove(): void;
}

export interface GoogleMapsMapMouseEvent {
  latLng?: GoogleMapsLatLng;
}

export interface GoogleMapsMap {
  addListener(eventName: 'idle', handler: () => void): GoogleMapsListener;
  addListener(
    eventName: 'click',
    handler: (event: GoogleMapsMapMouseEvent) => void,
  ): GoogleMapsListener;
  getCenter(): GoogleMapsLatLng | undefined;
  getZoom(): number | undefined;
  panTo(position: GoogleMapsLatLngLiteral): void;
  setCenter(position: GoogleMapsLatLngLiteral): void;
}

export interface GoogleMapsCircle {
  setMap(map: GoogleMapsMap | null): void;
}

export interface GoogleMapsPinOptions {
  background?: string;
  borderColor?: string;
  glyphColor?: string;
  glyphSrc?: string;
  glyphText?: string;
  scale?: number;
}

export type GoogleMapsPinElement = object;

export interface GoogleMapsAdvancedMarkerOptions {
  gmpClickable?: boolean;
  gmpDraggable?: boolean;
  map?: GoogleMapsMap | null;
  position: GoogleMapsLatLngLiteral;
  title?: string;
  zIndex?: number;
}

export interface GoogleMapsAdvancedMarkerElement {
  addListener(eventName: 'dragend', handler: () => void): GoogleMapsListener;
  addEventListener(eventName: 'gmp-click', handler: () => void): void;
  map: GoogleMapsMap | null;
  position: GoogleMapsLatLngLiteral;
  removeEventListener(eventName: 'gmp-click', handler: () => void): void;
  replaceChildren(...nodes: GoogleMapsPinElement[]): void;
  title: string;
  zIndex?: number;
}

export interface GoogleMapsMarkerLibrary {
  AdvancedMarkerElement: new (
    options: GoogleMapsAdvancedMarkerOptions,
  ) => GoogleMapsAdvancedMarkerElement;
  PinElement: new (options: GoogleMapsPinOptions) => GoogleMapsPinElement;
}

export interface GoogleMapsLatLngAltitudeLiteral {
  altitude?: number;
  lat: number;
  lng: number;
}

export type GoogleMaps3DAltitudeMode = 'ABSOLUTE' | 'CLAMP_TO_GROUND' | 'RELATIVE_TO_GROUND';

export type GoogleMaps3DMapMode = 'HYBRID' | 'SATELLITE';

export interface GoogleMaps3DMapOptions {
  center: GoogleMapsLatLngAltitudeLiteral;
  defaultUIHidden?: boolean;
  fov?: number;
  heading: number;
  mapId?: string;
  mode: GoogleMaps3DMapMode;
  range: number;
  tilt: number;
}

export interface GoogleMaps3DCameraOptions {
  altitudeMode?: GoogleMaps3DAltitudeMode;
  cameraPosition?: GoogleMapsLatLngAltitudeLiteral;
  center?: GoogleMapsLatLngAltitudeLiteral;
  fov?: number;
  heading?: number;
  range?: number;
  roll?: number;
  tilt?: number;
}

export interface GoogleMaps3DFlyAroundAnimationOptions {
  camera: GoogleMaps3DCameraOptions;
  durationMillis?: number;
  repeatCount?: number;
}

export interface GoogleMaps3DFlyToAnimationOptions {
  durationMillis?: number;
  endCamera: GoogleMaps3DCameraOptions;
}

export interface GoogleMaps3DMapElement extends HTMLElement {
  center: GoogleMapsLatLngAltitudeLiteral;
  flyCameraAround?: (options: GoogleMaps3DFlyAroundAnimationOptions) => Promise<void> | void;
  flyCameraTo?: (options: GoogleMaps3DFlyToAnimationOptions) => Promise<void> | void;
  fov?: number;
  heading: number;
  mode: GoogleMaps3DMapMode;
  range: number;
  stopCameraAnimation?: () => Promise<void> | void;
  tilt: number;
}

export interface GoogleMaps3DMarkerOptions {
  altitudeMode?: GoogleMaps3DAltitudeMode;
  drawsWhenOccluded?: boolean;
  extruded?: boolean;
  label?: string;
  position: GoogleMapsLatLngAltitudeLiteral;
  sizePreserved?: boolean;
  title?: string;
  zIndex?: number;
}

export interface GoogleMaps3DMarkerElement extends HTMLElement {
  altitudeMode?: GoogleMaps3DAltitudeMode;
  drawsWhenOccluded?: boolean;
  label?: string;
  position: GoogleMapsLatLngAltitudeLiteral;
  sizePreserved?: boolean;
  title: string;
  zIndex?: number;
}

export interface GoogleMaps3DLibrary {
  Map3DElement: new (options: GoogleMaps3DMapOptions) => GoogleMaps3DMapElement;
  Marker3DInteractiveElement: new (options: GoogleMaps3DMarkerOptions) => GoogleMaps3DMarkerElement;
}

export interface GoogleMapsFetchFieldsRequest {
  fields: readonly string[];
}

export interface GoogleMapsPlace {
  displayName?: string | null;
  fetchFields(request: GoogleMapsFetchFieldsRequest): Promise<{ place: GoogleMapsPlace }>;
  formattedAddress?: string;
  location?: GoogleMapsLatLng;
}

export interface GoogleMapsFormattableText {
  text: string;
  toString(): string;
}

export interface GoogleMapsPlacePrediction {
  mainText?: GoogleMapsFormattableText;
  placeId: string;
  secondaryText?: GoogleMapsFormattableText;
  text: GoogleMapsFormattableText;
  toPlace(): GoogleMapsPlace;
}

export type GoogleMapsAutocompleteSessionToken = object;

export interface GoogleMapsAutocompleteRequest {
  includedRegionCodes?: readonly string[];
  input: string;
  origin?: GoogleMapsLatLngLiteral;
  region?: string;
  sessionToken?: GoogleMapsAutocompleteSessionToken;
}

export interface GoogleMapsAutocompleteSuggestion {
  placePrediction?: GoogleMapsPlacePrediction;
}

export interface GoogleMapsAutocompleteSuggestionClass {
  fetchAutocompleteSuggestions(
    request: GoogleMapsAutocompleteRequest,
  ): Promise<{ suggestions: GoogleMapsAutocompleteSuggestion[] }>;
}

export interface GoogleMapsPlacesLibrary {
  AutocompleteSessionToken: new () => GoogleMapsAutocompleteSessionToken;
  AutocompleteSuggestion: GoogleMapsAutocompleteSuggestionClass;
}

export interface GoogleMapsNamespace {
  maps: {
    Circle: new (options: Record<string, unknown>) => GoogleMapsCircle;
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapsMap;
    event: {
      clearInstanceListeners(instance: unknown): void;
    };
    importLibrary?: {
      (name: 'maps3d'): Promise<GoogleMaps3DLibrary>;
      (name: 'marker'): Promise<GoogleMapsMarkerLibrary>;
      (name: 'places'): Promise<GoogleMapsPlacesLibrary>;
    };
  };
}

declare global {
  interface Window {
    __petradarGoogleMapsReady?: () => void;
    google?: GoogleMapsNamespace;
  }
}
