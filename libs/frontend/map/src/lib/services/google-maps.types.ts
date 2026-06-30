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
  };
}

declare global {
  interface Window {
    __petradarGoogleMapsReady?: () => void;
    google?: GoogleMapsNamespace;
  }
}

