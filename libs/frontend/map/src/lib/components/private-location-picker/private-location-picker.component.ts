import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PrivateLocationSearchService,
  RuntimeConfigService,
  type PrivateLocationSearchResult,
} from '@petradar/frontend/core';

import {
  GoogleMapsLoadError,
  GoogleMapsLoaderService,
} from '../../services/google-maps-loader.service.js';
import type {
  GoogleMapsAdvancedMarkerElement,
  GoogleMapsAutocompleteSessionToken,
  GoogleMapsLatLngLiteral,
  GoogleMapsListener,
  GoogleMapsMap,
  GoogleMapsMapMouseEvent,
  GoogleMapsNamespace,
  GoogleMapsPlace,
  GoogleMapsPlacePrediction,
  GoogleMapsPlacesLibrary,
} from '../../services/google-maps.types.js';

export type PrivateLocationSelectionSource =
  | 'fallback-coordinates'
  | 'fallback-search'
  | 'google-map'
  | 'google-place';

export interface PrivateLocationSelection {
  latitude: number;
  longitude: number;
  label: string;
  source: PrivateLocationSelectionSource;
}

type PickerState = 'fallback' | 'loading' | 'ready';

const coordinatePrecision = 6;
const defaultZoom = 16;
const defaultGoogleVectorMapId = 'DEMO_MAP_ID';

@Component({
  selector: 'pr-private-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './private-location-picker.component.css',
  templateUrl: './private-location-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateLocationPickerComponent implements AfterViewInit, OnDestroy {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly label = input('Selected private pin');
  readonly coordinateLabel = input('');
  readonly locationSelected = output<PrivateLocationSelection>();

  readonly state = signal<PickerState>('loading');
  readonly statusMessage = signal('Loading Google Maps...');
  readonly fallbackResults = signal<readonly PrivateLocationSearchResult[]>([]);
  readonly fallbackMessage = signal('');
  readonly placePredictions = signal<readonly GoogleMapsPlacePrediction[]>([]);
  readonly placeSearchMessage = signal('');
  googleQuery = '';
  fallbackQuery = '';

  private readonly googleMaps = inject(GoogleMapsLoaderService);
  private readonly fallbackSearch = inject(PrivateLocationSearchService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly zone = inject(NgZone);
  private readonly mapHost = viewChild.required<ElementRef<HTMLElement>>('mapHost');

  private api: GoogleMapsNamespace | undefined;
  private placesLibrary: GoogleMapsPlacesLibrary | undefined;
  private map: GoogleMapsMap | undefined;
  private marker: GoogleMapsAdvancedMarkerElement | undefined;
  private sessionToken: GoogleMapsAutocompleteSessionToken | undefined;
  private listeners: GoogleMapsListener[] = [];
  private placeSearchSequence = 0;

  constructor() {
    effect(() => {
      const position = this.currentPosition();
      if (!this.marker || !this.map) {
        return;
      }

      this.marker.position = position;
    });
  }

  ngAfterViewInit(): void {
    void this.initializeGooglePicker();
  }

  ngOnDestroy(): void {
    for (const listener of this.listeners) {
      listener.remove();
    }
    this.listeners = [];
    if (this.marker) {
      this.marker.map = null;
    }
    if (this.api && this.map) {
      this.api.maps.event.clearInstanceListeners(this.map);
    }
    this.map = undefined;
    this.marker = undefined;
    this.placesLibrary = undefined;
    this.sessionToken = undefined;
  }

  handleGoogleQueryChange(query: string): void {
    this.googleQuery = query;
    const normalizedQuery = query.trim();
    const placesLibrary = this.placesLibrary;
    if (!placesLibrary) {
      return;
    }

    const sequence = ++this.placeSearchSequence;
    if (normalizedQuery.length < 2) {
      this.placePredictions.set([]);
      this.placeSearchMessage.set('Type at least 2 characters to search Google Places.');
      return;
    }

    this.placeSearchMessage.set('Searching Google Places...');
    void this.fetchGooglePredictions(placesLibrary, normalizedQuery, sequence);
  }

  selectGooglePrediction(prediction: GoogleMapsPlacePrediction): void {
    const placesLibrary = this.placesLibrary;
    if (!placesLibrary) {
      return;
    }

    this.placeSearchMessage.set('Moving private pin...');
    void this.resolveGooglePrediction(placesLibrary, prediction);
  }

  searchFallbackLocations(): void {
    const query = this.fallbackQuery.trim();
    if (query.length < 2) {
      this.fallbackResults.set([]);
      this.fallbackMessage.set('Type a place, district, landmark, address hint, or lat,lng.');
      return;
    }

    const results = this.fallbackSearch.search(query);
    this.fallbackResults.set(results);
    this.fallbackMessage.set(
      results.length === 0
        ? 'No local place match found. Paste coordinates or adjust the fields.'
        : '',
    );
  }

  selectFallbackResult(result: PrivateLocationSearchResult): void {
    this.fallbackQuery = result.label;
    this.fallbackResults.set([]);
    this.fallbackMessage.set(`Private pin moved to ${result.label}.`);
    this.emitLocation(result.latitude, result.longitude, result.label, fallbackSource(result));
  }

  private async initializeGooglePicker(): Promise<void> {
    try {
      const [api, markerLibrary, placesLibrary] = await Promise.all([
        this.googleMaps.load(),
        this.googleMaps.loadMarkerLibrary(),
        this.googleMaps.loadPlaces(),
      ]);

      const position = this.currentPosition();
      const map = new api.maps.Map(this.mapHost().nativeElement, {
        center: position,
        clickableIcons: false,
        fullscreenControl: false,
        mapId: this.runtimeConfig.googleMaps3dMapId() ?? defaultGoogleVectorMapId,
        mapTypeControl: false,
        streetViewControl: false,
        zoom: defaultZoom,
        zoomControl: true,
      });
      const pin = new markerLibrary.PinElement({
        background: '#0f766e',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        glyphText: 'P',
        scale: 1.1,
      });
      const marker = new markerLibrary.AdvancedMarkerElement({
        gmpDraggable: true,
        map,
        position,
        title: 'Exact private pin',
      });
      marker.replaceChildren(pin);
      this.listeners.push(
        map.addListener('click', (event) => {
          this.zone.run(() => {
            this.selectGoogleEventLocation(event, 'Selected on map', 'google-map');
          });
        }),
        marker.addListener('dragend', () => {
          this.zone.run(() => {
            const position = marker.position;
            this.emitLocation(position.lat, position.lng, 'Dragged private pin', 'google-map');
          });
        }),
      );

      this.api = api;
      this.placesLibrary = placesLibrary;
      this.map = map;
      this.marker = marker;
      this.sessionToken = new placesLibrary.AutocompleteSessionToken();
      this.state.set('ready');
      this.statusMessage.set('Search Google Places or click the map to move the private pin.');
    } catch (error) {
      this.activateFallback(toFallbackMessage(error));
    }
  }

  private async fetchGooglePredictions(
    placesLibrary: GoogleMapsPlacesLibrary,
    input: string,
    sequence: number,
  ): Promise<void> {
    try {
      const response = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        includedRegionCodes: ['th'],
        input,
        origin: this.currentPosition(),
        region: 'th',
        sessionToken: this.sessionToken,
      });
      this.zone.run(() => {
        if (sequence !== this.placeSearchSequence) {
          return;
        }

        const predictions = response.suggestions
          .map((suggestion) => suggestion.placePrediction)
          .filter(
            (prediction): prediction is GoogleMapsPlacePrediction => prediction !== undefined,
          );
        this.placePredictions.set(predictions);
        this.placeSearchMessage.set(
          predictions.length === 0 ? 'No Google Places match found.' : '',
        );
      });
    } catch {
      this.zone.run(() => {
        if (sequence !== this.placeSearchSequence) {
          return;
        }

        this.placePredictions.set([]);
        this.placeSearchMessage.set('Google Places suggestions are unavailable right now.');
      });
    }
  }

  private async resolveGooglePrediction(
    placesLibrary: GoogleMapsPlacesLibrary,
    prediction: GoogleMapsPlacePrediction,
  ): Promise<void> {
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });
      this.zone.run(() => {
        this.googleQuery = prediction.text.text;
        this.placePredictions.set([]);
        this.sessionToken = new placesLibrary.AutocompleteSessionToken();
        this.selectGooglePlace(place);
      });
    } catch {
      this.zone.run(() => {
        this.placeSearchMessage.set('Place details are unavailable. Try another result.');
      });
    }
  }

  private selectGoogleEventLocation(
    event: GoogleMapsMapMouseEvent,
    label: string,
    source: PrivateLocationSelectionSource,
  ): void {
    const location = event.latLng;
    if (!location) {
      return;
    }

    this.emitLocation(location.lat(), location.lng(), label, source);
  }

  private selectGooglePlace(place: GoogleMapsPlace): void {
    const location = place.location;
    if (!location) {
      this.statusMessage.set('Choose a place from the dropdown so the private pin can move.');
      return;
    }

    const label = firstNonEmpty(
      place.displayName?.trim() ?? undefined,
      place.formattedAddress?.trim(),
      'Google Places result',
    );
    this.emitLocation(location.lat(), location.lng(), label, 'google-place');
  }

  private emitLocation(
    latitude: number,
    longitude: number,
    label: string,
    source: PrivateLocationSelectionSource,
  ): void {
    const selection = {
      label,
      latitude: roundCoordinate(Math.max(-90, Math.min(90, latitude))),
      longitude: roundCoordinate(Math.max(-180, Math.min(180, longitude))),
      source,
    };
    const position = toGooglePosition(selection.latitude, selection.longitude);
    if (this.marker) {
      this.marker.position = position;
    }
    this.map?.panTo(position);
    this.statusMessage.set(`Private pin moved to ${label}.`);
    this.locationSelected.emit(selection);
  }

  private activateFallback(message: string): void {
    this.state.set('fallback');
    this.statusMessage.set(message);
  }

  private currentPosition(): GoogleMapsLatLngLiteral {
    return toGooglePosition(this.latitude(), this.longitude());
  }
}

function fallbackSource(result: PrivateLocationSearchResult): PrivateLocationSelectionSource {
  return result.kind === 'coordinates' ? 'fallback-coordinates' : 'fallback-search';
}

function toGooglePosition(latitude: number, longitude: number): GoogleMapsLatLngLiteral {
  return {
    lat: latitude,
    lng: longitude,
  };
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(coordinatePrecision));
}

function firstNonEmpty(...values: readonly (string | undefined)[]): string {
  return values.find((value): value is string => value !== undefined && value.length > 0) ?? '';
}

function toFallbackMessage(error: unknown): string {
  if (error instanceof GoogleMapsLoadError && error.reason === 'missing-key') {
    return 'Google Maps needs a local browser key. Use fallback search or exact fields for now.';
  }
  if (error instanceof GoogleMapsLoadError) {
    return 'Google Maps could not load. Use fallback search or exact fields for now.';
  }

  return 'Google Maps is unavailable. Use fallback search or exact fields for now.';
}
