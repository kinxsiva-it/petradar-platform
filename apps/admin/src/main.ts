import { bootstrapApplication } from '@angular/platform-browser';

import { loadPetRadarRuntimeConfig } from '@petradar/frontend/core';

import { AdminAppComponent } from './app/admin-app.component.js';
import { adminAppConfig } from './app/admin-app.config.js';

loadPetRadarRuntimeConfig()
  .then(() => bootstrapApplication(AdminAppComponent, adminAppConfig))
  .catch((error: unknown) => {
    console.error(error);
  });
