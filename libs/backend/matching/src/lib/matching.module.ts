import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';

import { MatchingController } from './matching.controller.js';
import { MatchingService } from './matching.service.js';

@Module({
  controllers: [MatchingController],
  exports: [MatchingService],
  imports: [AuditModule, BackendAuthModule, PrismaModule],
  providers: [MatchingService],
})
export class MatchingModule {}
