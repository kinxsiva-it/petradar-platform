import { Module } from '@nestjs/common';

import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController],
  exports: [NotificationsService],
  imports: [BackendAuthModule, PrismaModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
