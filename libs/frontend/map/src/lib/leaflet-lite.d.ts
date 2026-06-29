declare module 'leaflet' {
  export type LatLngExpression = [number, number];

  export interface Layer {
    addTo(map: Map): this;
  }

  export interface Map {
    invalidateSize(): this;
    removeLayer(layer: Layer): this;
    remove(): void;
    setView(center: LatLngExpression, zoom: number): this;
  }

  export interface Marker extends Layer {
    on(eventName: 'click', handler: () => void): this;
  }

  export interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
  }

  export interface MapOptions {
    zoomControl?: boolean;
  }

  export interface ControlPositionOptions {
    position?: 'bottomright' | 'topleft' | 'topright' | 'bottomleft';
  }

  export interface CircleOptions {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    radius?: number;
    weight?: number;
  }

  export interface DivIconOptions {
    className?: string;
    html?: string;
    iconAnchor?: [number, number];
    iconSize?: [number, number];
  }

  export interface MarkerOptions {
    icon?: Layer;
    title?: string;
  }

  export interface Control {
    addTo(map: Map): this;
  }

  export const control: {
    zoom(options?: ControlPositionOptions): Control;
  };

  export function map(element: HTMLElement, options?: MapOptions): Map;
  export function tileLayer(url: string, options?: TileLayerOptions): Layer;
  export function circle(center: LatLngExpression, options?: CircleOptions): Layer;
  export function marker(center: LatLngExpression, options?: MarkerOptions): Marker;
  export function divIcon(options?: DivIconOptions): Layer;
}
