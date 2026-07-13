declare module 'leaflet' {
  export type LatLngExpression = [number, number];
  export interface LeafletMouseEvent { latlng: { lat: number; lng: number }; }
  export interface Layer { addTo(map: Map): this; remove(): this; }
  export interface Map {
    invalidateSize(): this;
    on(eventName: 'click', handler: (event: LeafletMouseEvent) => void): this;
    remove(): void;
    setView(center: LatLngExpression, zoom: number): this;
  }
  export interface Marker extends Layer {
    getLatLng(): { lat: number; lng: number };
    on(eventName: 'click', handler: () => void): this;
    on(eventName: 'dragend', handler: () => void): this;
  }
  export interface CircleOptions { color?: string; fillColor?: string; fillOpacity?: number; radius?: number; weight?: number; }
  export interface MarkerOptions { draggable?: boolean; title?: string; }
  export interface TileLayerOptions { attribution?: string; maxZoom?: number; }
  export function map(element: HTMLElement, options?: { zoomControl?: boolean }): Map;
  export function tileLayer(url: string, options?: TileLayerOptions): Layer;
  export function circle(center: LatLngExpression, options?: CircleOptions): Layer;
  export function marker(center: LatLngExpression, options?: MarkerOptions): Marker;
}
