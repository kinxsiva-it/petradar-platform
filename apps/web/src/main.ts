import { bootstrapApplication } from '@angular/platform-browser';

import { loadPetRadarRuntimeConfig } from '@petradar/frontend/core';

import { AppComponent } from './app/app.component.js';
import { appConfig } from './app/app.config.js';

loadPetRadarRuntimeConfig()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((error: unknown) => {
    console.error(error);
  });
