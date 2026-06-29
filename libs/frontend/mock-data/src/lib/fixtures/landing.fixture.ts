import type { LandingFeature, LandingMetric } from '../models/landing.model.js';

export const landingMetrics: LandingMetric[] = [
  { label: 'Sightings reported', value: '24,860', delta: '+16% this month' },
  { label: 'Lost pet matches', value: '5,312', delta: '+20% this month' },
  { label: 'Rescue cases', value: '1,286', delta: '+19% this month' },
  { label: 'Verified volunteers', value: '2,743', delta: '+23% this month' },
];

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Community Sightings',
    description: 'Real-time reports from people near you.',
    icon: 'eye',
  },
  {
    title: 'Lost Pet Matching',
    description: 'Mock matching previews help reconnect pets with families.',
    icon: 'heart',
  },
  {
    title: 'Rescue Case Tracking',
    description: 'Follow cases from report to resolution.',
    icon: 'lifebuoy',
  },
  {
    title: 'Animal Heatmap',
    description: 'See where help is most needed without exposing exact locations.',
    icon: 'pin',
  },
  {
    title: 'Privacy-Protected Locations',
    description: 'Exact coordinates stay hidden from public views.',
    icon: 'shield',
  },
];
