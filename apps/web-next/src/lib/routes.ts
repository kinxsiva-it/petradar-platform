export const routes = {
  communityGuidelines: '/community-guidelines',
  home: '/',
  login: '/login',
  lostPets: '/lost-pets',
  lostPetNew: '/lost-pets/new',
  map: '/map',
  matches: '/matches',
  myLostPets: '/my/lost-pets',
  myReports: '/my/reports',
  notifications: '/notifications',
  profile: '/profile',
  register: '/register',
  reportAnimal: '/report-animal',
  settings: '/settings',
} as const;

export function lostPetDetailRoute(id: string): string {
  return `${routes.lostPets}/${encodeURIComponent(id)}`;
}

export function lostPetEditRoute(id: string): string {
  return `${lostPetDetailRoute(id)}/edit`;
}

export function matchDetailRoute(id: string): string {
  return `${routes.matches}/${encodeURIComponent(id)}`;
}

export const primaryNavigation = [
  { href: routes.map, label: 'Map' },
  { href: routes.lostPets, label: 'Lost Pets' },
  { href: routes.matches, label: 'Matches' },
  { href: routes.reportAnimal, label: 'Report Animal' },
  { href: routes.communityGuidelines, label: 'Guidelines' },
] as const;

export function safeReturnUrl(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }

  return value;
}

export type UserWebRoute = (typeof routes)[keyof typeof routes];
