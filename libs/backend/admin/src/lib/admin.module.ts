import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';
import { SightingsModule } from '@petradar/backend/sightings';

import { AdminReportsController } from './admin-reports.controller.js';
import { AdminSightingsController } from './admin-sightings.controller.js';
import { AdminSightingsService } from './admin-sightings.service.js';

@Module({
  controllers: [AdminReportsController, AdminSightingsController],
  imports: [AuditModule, BackendAuthModule, PrismaModule, SightingsModule],
  providers: [AdminSightingsService],
})
export class AdminModule {}
