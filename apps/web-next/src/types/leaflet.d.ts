declare module 'leaflet' {
  export type LatLngExpression = [number, number];
  export interface LeafletMouseEvent { latlng: { lat: number; lng: number }; }
  export interface Layer { addTo(map: Map): this; remove(): this; }
  export interface Map {
    getCenter(): { lat: number; lng: number };
    getZoom(): number;
    invalidateSize(): this;
    on(eventName: 'click', handler: (event: LeafletMouseEvent) => void): this;
    on(eventName: 'moveend', handler: () => void): this;
    remove(): void;
    setView(center: LatLngExpression, zoom: number): this;
  }
  export interface Marker extends Layer {
    getLatLng(): { lat: number; lng: number };
    on(eventName: 'click' | 'dragend', handler: () => void): this;
  }
  export interface CircleMarker extends Layer {
    bindTooltip(content: string, options?: TooltipOptions): this;
    on(eventName: 'click', handler: () => void): this;
  }
  export interface CircleOptions { className?: string; color?: string; fillColor?: string; fillOpacity?: number; interactive?: boolean; radius?: number; weight?: number; }
  export interface MarkerOptions { draggable?: boolean; icon?: Icon; title?: string; }
  export interface IconOptions { className?: string; iconAnchor?: [number, number]; iconSize: [number, number]; iconUrl: string; }
  export interface Icon {}
  export interface TileLayerOptions { attribution?: string; maxZoom?: number; }
  export interface TooltipOptions { direction?: 'auto' | 'bottom' | 'center' | 'left' | 'right' | 'top'; offset?: [number, number]; }
  export function map(element: HTMLElement, options?: { zoomControl?: boolean }): Map;
  export function tileLayer(url: string, options?: TileLayerOptions): Layer;
  export function circle(center: LatLngExpression, options?: CircleOptions): Layer;
  export function circleMarker(center: LatLngExpression, options?: CircleOptions): CircleMarker;
  export function icon(options: IconOptions): Icon;
  export function marker(center: LatLngExpression, options?: MarkerOptions): Marker;
}
