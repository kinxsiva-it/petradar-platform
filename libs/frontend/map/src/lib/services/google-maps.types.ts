export interface GoogleMapsLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapsListener {
  remove(): void;
}

export interface GoogleMapsMap {
  addListener(eventName: 'idle', handler: () => void): GoogleMapsListener;
  getCenter(): GoogleMapsLatLng | undefined;
  getZoom(): number | undefined;
}

export interface GoogleMapsMarker {
  addListener(eventName: 'click', handler: () => void): GoogleMapsListener;
  setMap(map: GoogleMapsMap | null): void;
}

export interface GoogleMapsCircle {
  setMap(map: GoogleMapsMap | null): void;
}

export interface GoogleMapsLatLngAltitudeLiteral {
  altitude?: number;
  lat: number;
  lng: number;
}

export type GoogleMaps3DAltitudeMode =
  | 'ABSOLUTE'
  | 'CLAMP_TO_GROUND'
  | 'RELATIVE_TO_GROUND';

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
  Marker3DInteractiveElement: new (
    options: GoogleMaps3DMarkerOptions,
  ) => GoogleMaps3DMarkerElement;
}

export interface GoogleMapsNamespace {
  maps: {
    Circle: new (options: Record<string, unknown>) => GoogleMapsCircle;
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapsMap;
    Marker: new (options: Record<string, unknown>) => GoogleMapsMarker;
    SymbolPath: {
      CIRCLE: unknown;
    };
    event: {
      clearInstanceListeners(instance: unknown): void;
    };
    importLibrary?: (name: 'maps3d') => Promise<GoogleMaps3DLibrary>;
  };
}

declare global {
  interface Window {
    __petradarGoogleMapsReady?: () => void;
    google?: GoogleMapsNamespace;
  }
}

