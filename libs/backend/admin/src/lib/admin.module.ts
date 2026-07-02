import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';
import { SightingsModule } from '@petradar/backend/sightings';

import { AdminReportsController } from './admin-reports.controller.js';
import { AdminSightingsController } from './admin-sightings.controller.js';
import { AdminSightingsService } from './admin-sightings.service.js';
import { AdminAuditLogsController } from './admin-audit-logs.controller.js';
import { AdminAuditLogsService } from './admin-audit-logs.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

@Module({
  controllers: [
    AdminAuditLogsController,
    AdminReportsController,
    AdminSightingsController,
    AdminUsersController,
  ],
  imports: [AuditModule, BackendAuthModule, PrismaModule, SightingsModule],
  providers: [AdminAuditLogsService, AdminSightingsService, AdminUsersService],
})
export class AdminModule {}
