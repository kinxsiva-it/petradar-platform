export interface PetRadarRuntimeConfig {
  googleMaps3dMapId?: string;
  googleMapsApiKey?: string;
}

declare global {
  interface Window {
    __PETRADAR_RUNTIME_CONFIG__?: PetRadarRuntimeConfig;
  }
}

