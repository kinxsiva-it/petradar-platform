export interface PetRadarRuntimeConfig {
  googleMapsApiKey?: string;
}

declare global {
  interface Window {
    __PETRADAR_RUNTIME_CONFIG__?: PetRadarRuntimeConfig;
  }
}

