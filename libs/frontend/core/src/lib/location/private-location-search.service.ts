import { Injectable } from '@angular/core';

export type PrivateLocationSearchKind = 'coordinates' | 'district' | 'landmark' | 'station';

export interface PrivateLocationSearchResult {
  id: string;
  label: string;
  description: string;
  latitude: number;
  longitude: number;
  kind: PrivateLocationSearchKind;
}

interface PlaceIndexEntry extends PrivateLocationSearchResult {
  aliases: readonly string[];
}

const coordinatePrecision = 6;
const defaultLimit = 5;
const minimumQueryLength = 2;

const placeIndex: readonly PlaceIndexEntry[] = [
  {
    aliases: ['ari bts', 'phaya thai ari', 'ari bangkok'],
    description: 'Phaya Thai district, near Ari BTS',
    id: 'ari',
    kind: 'station',
    label: 'Ari',
    latitude: 13.779926,
    longitude: 100.544984,
  },
  {
    aliases: ['siam', 'siam paragon', 'siam square', 'pathum wan'],
    description: 'Pathum Wan district, central Bangkok',
    id: 'siam-paragon',
    kind: 'landmark',
    label: 'Siam Paragon',
    latitude: 13.746562,
    longitude: 100.534799,
  },
  {
    aliases: ['chatuchak', 'jj market', 'mo chit', 'chatuchak weekend market'],
    description: 'Chatuchak district, near Mo Chit BTS',
    id: 'chatuchak-market',
    kind: 'landmark',
    label: 'Chatuchak Weekend Market',
    latitude: 13.79965,
    longitude: 100.550565,
  },
  {
    aliases: ['victory monument', 'anusawari', 'ratchathewi'],
    description: 'Ratchathewi district transit hub',
    id: 'victory-monument',
    kind: 'landmark',
    label: 'Victory Monument',
    latitude: 13.764944,
    longitude: 100.538292,
  },
  {
    aliases: ['silom', 'sala daeng', 'bang rak'],
    description: 'Bang Rak district, near Silom Road',
    id: 'silom',
    kind: 'district',
    label: 'Silom',
    latitude: 13.728564,
    longitude: 100.534169,
  },
  {
    aliases: ['asok', 'asoke', 'sukhumvit', 'terminal 21', 'wattana', 'watthana'],
    description: 'Watthana district, Asok and Sukhumvit area',
    id: 'asok',
    kind: 'station',
    label: 'Asok / Sukhumvit',
    latitude: 13.737275,
    longitude: 100.560011,
  },
  {
    aliases: ['thong lo', 'thonglor', 'sukhumvit 55', 'watthana'],
    description: 'Watthana district, Sukhumvit 55 area',
    id: 'thong-lo',
    kind: 'station',
    label: 'Thong Lo',
    latitude: 13.724365,
    longitude: 100.578507,
  },
  {
    aliases: ['ekkamai', 'e7', 'sukhumvit 63', 'watthana'],
    description: 'Watthana district, Ekkamai BTS area',
    id: 'ekkamai',
    kind: 'station',
    label: 'Ekkamai',
    latitude: 13.719527,
    longitude: 100.585148,
  },
  {
    aliases: ['on nut', 'onnut', 'sukhumvit 77', 'phra khanong'],
    description: 'Phra Khanong district, On Nut BTS area',
    id: 'on-nut',
    kind: 'station',
    label: 'On Nut',
    latitude: 13.705637,
    longitude: 100.601033,
  },
  {
    aliases: ['khlong toei', 'queen sirikit', 'qsncc'],
    description: 'Khlong Toei district, near Queen Sirikit center',
    id: 'khlong-toei',
    kind: 'district',
    label: 'Khlong Toei',
    latitude: 13.722227,
    longitude: 100.560965,
  },
  {
    aliases: ['lat phrao', 'ladprao', 'central ladprao', 'phahon yothin'],
    description: 'Lat Phrao and Phahon Yothin area',
    id: 'lat-phrao',
    kind: 'district',
    label: 'Lat Phrao',
    latitude: 13.816289,
    longitude: 100.561749,
  },
  {
    aliases: ['huai khwang', 'huay kwang', 'ratchada', 'ratchadaphisek'],
    description: 'Huai Khwang district, Ratchadaphisek area',
    id: 'huai-khwang',
    kind: 'district',
    label: 'Huai Khwang',
    latitude: 13.778681,
    longitude: 100.573214,
  },
  {
    aliases: ['din daeng', 'dindaeng', 'ratchada'],
    description: 'Din Daeng district',
    id: 'din-daeng',
    kind: 'district',
    label: 'Din Daeng',
    latitude: 13.769734,
    longitude: 100.552699,
  },
  {
    aliases: ['sathon', 'sathorn', 'lumpini', 'lumphini'],
    description: 'Sathon district, near Lumphini Park',
    id: 'sathon',
    kind: 'district',
    label: 'Sathon',
    latitude: 13.722688,
    longitude: 100.543068,
  },
  {
    aliases: ['bang na', 'bangna', 'bitec', 'bearing'],
    description: 'Bang Na district, near BITEC',
    id: 'bang-na',
    kind: 'district',
    label: 'Bang Na',
    latitude: 13.668218,
    longitude: 100.604609,
  },
  {
    aliases: ['kasetsart', 'ku', 'kasetsart university', 'bang khen'],
    description: 'Bang Khen and Chatuchak area, near Kasetsart University',
    id: 'kasetsart-university',
    kind: 'landmark',
    label: 'Kasetsart University',
    latitude: 13.847084,
    longitude: 100.57191,
  },
  {
    aliases: ['grand palace', 'sanam luang', 'rattanakosin', 'phra nakhon'],
    description: 'Phra Nakhon district, historic Bangkok',
    id: 'grand-palace',
    kind: 'landmark',
    label: 'Grand Palace',
    latitude: 13.750033,
    longitude: 100.491453,
  },
  {
    aliases: ['chinatown', 'yaowarat', 'samphanthawong'],
    description: 'Samphanthawong district, Yaowarat Road',
    id: 'yaowarat',
    kind: 'landmark',
    label: 'Yaowarat / Chinatown',
    latitude: 13.740916,
    longitude: 100.508858,
  },
  {
    aliases: ['chulalongkorn', 'chula', 'sam yan', 'pathum wan'],
    description: 'Pathum Wan district, near Chulalongkorn University',
    id: 'chulalongkorn-university',
    kind: 'landmark',
    label: 'Chulalongkorn University',
    latitude: 13.738104,
    longitude: 100.532857,
  },
  {
    aliases: ['don mueang', 'don muang', 'dmk', 'airport'],
    description: 'Don Mueang district, airport area',
    id: 'don-mueang',
    kind: 'landmark',
    label: 'Don Mueang Airport',
    latitude: 13.912599,
    longitude: 100.60675,
  },
];

@Injectable({ providedIn: 'root' })
export class PrivateLocationSearchService {
  search(query: string, limit = defaultLimit): PrivateLocationSearchResult[] {
    const coordinateResult = parseCoordinateQuery(query);
    if (coordinateResult) {
      return [coordinateResult];
    }

    const normalizedQuery = normalizeText(query);
    if (normalizedQuery.length < minimumQueryLength) {
      return [];
    }

    const queryTokens = tokensFor(normalizedQuery);
    const resultLimit = Math.max(1, Math.min(8, Math.floor(limit)));

    return placeIndex
      .map((place) => ({ place, score: scorePlace(place, normalizedQuery, queryTokens) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.place.label.localeCompare(right.place.label),
      )
      .slice(0, resultLimit)
      .map(({ place }) => toResult(place));
  }
}

function parseCoordinateQuery(query: string): PrivateLocationSearchResult | null {
  const trimmed = query.trim();
  const match = /^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const latitudeText = match[1];
  const longitudeText = match[2];
  if (latitudeText === undefined || longitudeText === undefined) {
    return null;
  }

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  const roundedLatitude = roundCoordinate(latitude);
  const roundedLongitude = roundCoordinate(longitude);
  return {
    description: 'Exact coordinates pasted into the private pin search',
    id: `coordinates-${String(roundedLatitude)}-${String(roundedLongitude)}`,
    kind: 'coordinates',
    label: 'Pasted coordinates',
    latitude: roundedLatitude,
    longitude: roundedLongitude,
  };
}

function scorePlace(
  place: PlaceIndexEntry,
  normalizedQuery: string,
  queryTokens: readonly string[],
): number {
  const haystacks = [
    normalizeText(place.label),
    normalizeText(place.description),
    ...place.aliases.map((alias) => normalizeText(alias)),
  ];
  let score = 0;

  for (const haystack of haystacks) {
    if (haystack === normalizedQuery) {
      score += 100;
    } else if (haystack.startsWith(normalizedQuery)) {
      score += 60;
    } else if (haystack.includes(normalizedQuery)) {
      score += 40;
    }
  }

  for (const token of queryTokens) {
    if (haystacks.some((haystack) => haystack.split(' ').includes(token))) {
      score += 12;
    } else if (haystacks.some((haystack) => haystack.includes(token))) {
      score += 5;
    }
  }

  return score;
}

function toResult(place: PlaceIndexEntry): PrivateLocationSearchResult {
  return {
    description: place.description,
    id: place.id,
    kind: place.kind,
    label: place.label,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function tokensFor(normalizedText: string): readonly string[] {
  return normalizedText.split(' ').filter((token) => token.length >= minimumQueryLength);
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(coordinatePrecision));
}
