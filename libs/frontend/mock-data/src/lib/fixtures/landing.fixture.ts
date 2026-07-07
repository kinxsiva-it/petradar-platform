import type { LandingFeature, LandingMetric } from '../models/landing.model.js';

export const landingMetrics: LandingMetric[] = [
  {
    label: 'Sightings and reports',
    value: 'API-backed',
    delta: 'Submitted through PetRadar services',
  },
  {
    label: 'Public map safety',
    value: 'Private pins',
    delta: 'Exact coordinates stay out of public views',
  },
  {
    label: 'Lost pet matching',
    value: 'Reviewable',
    delta: 'Possible matches flow to owner and admin review',
  },
  {
    label: 'Rescue workflow',
    value: 'Coordinated',
    delta: 'Cases can be assigned and tracked by verified helpers',
  },
];

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Community Sightings',
    description: 'Real-time reports from people near you.',
    icon: 'eye',
  },
  {
    title: 'Lost Pet Matching',
    description: 'Possible-match reviews help reconnect pets with families.',
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
