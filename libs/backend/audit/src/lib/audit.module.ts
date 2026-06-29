import { Module } from '@nestjs/common';

import { PrismaModule } from '@petradar/backend/shared';

import { AuditService } from './audit.service.js';

@Module({
  exports: [AuditService],
  imports: [PrismaModule],
  providers: [AuditService],
})
export class AuditModule {}
