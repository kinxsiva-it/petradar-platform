import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { NotificationsModule } from '@petradar/backend/notifications';
import { LocationPrivacyService, PrismaModule } from '@petradar/backend/shared';
import { SightingsModule } from '@petradar/backend/sightings';

import { AdminReportsController } from './admin-reports.controller.js';
import { AdminSightingsController } from './admin-sightings.controller.js';
import { AdminSightingsService } from './admin-sightings.service.js';
import { AdminAuditLogsController } from './admin-audit-logs.controller.js';
import { AdminAuditLogsService } from './admin-audit-logs.service.js';
import { AdminPrivacyPolicyController } from './admin-privacy-policy.controller.js';
import { AdminPrivacyPolicyService } from './admin-privacy-policy.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

@Module({
  controllers: [
    AdminAuditLogsController,
    AdminPrivacyPolicyController,
    AdminReportsController,
    AdminSightingsController,
    AdminUsersController,
  ],
  imports: [AuditModule, BackendAuthModule, NotificationsModule, PrismaModule, SightingsModule],
  providers: [
    AdminAuditLogsService,
    AdminPrivacyPolicyService,
    AdminSightingsService,
    AdminUsersService,
    LocationPrivacyService,
  ],
})
export class AdminModule {}
