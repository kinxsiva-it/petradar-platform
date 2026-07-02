export interface AnalyticsSummaryResponse {
  activeLostPets?: number;
  activeRescueCases?: number;
  injuredCases?: number;
  pendingSightings?: number;
  possibleMatches?: number;
  resolvedRescueCases?: number;
  totalSightings?: number;
  verifiedSightings?: number;
}

export interface AnalyticsBreakdownItem {
  count: number;
  species?: string;
  status?: string;
}

export interface AnalyticsBySpeciesResponse {
  items: AnalyticsBreakdownItem[];
}

export interface AnalyticsByStatusResponse {
  lostPets: AnalyticsBreakdownItem[];
  matches: AnalyticsBreakdownItem[];
  rescueCases: AnalyticsBreakdownItem[];
  sightings: AnalyticsBreakdownItem[];
}

export interface AnalyticsHotspotPoint {
  count: number;
  latitude: number;
  longitude: number;
  weight: number;
}

export interface AnalyticsHotspotsResponse {
  items: AnalyticsHotspotPoint[];
}

export interface AnalyticsMetric {
  delta: string;
  label: string;
  tone: 'danger' | 'match' | 'success' | 'warning';
  value: number;
}

export interface AnalyticsChartSegment {
  color: string;
  label: string;
  value: number;
}
