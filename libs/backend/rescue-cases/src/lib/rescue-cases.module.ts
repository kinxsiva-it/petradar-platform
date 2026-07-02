import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { PrismaModule } from '@petradar/backend/shared';

import { RescueCasesController } from './rescue-cases.controller.js';
import { RescueCasesService } from './rescue-cases.service.js';

@Module({
  controllers: [RescueCasesController],
  exports: [RescueCasesService],
  imports: [AuditModule, BackendAuthModule, PrismaModule],
  providers: [RescueCasesService],
})
export class RescueCasesModule {}
