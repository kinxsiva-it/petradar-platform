import { Module } from '@nestjs/common';

import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';

import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  controllers: [AnalyticsController],
  imports: [BackendAuthModule, PrismaModule],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
