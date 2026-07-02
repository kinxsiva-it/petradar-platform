import { Module } from '@nestjs/common';

import { AuditModule } from '@petradar/backend/audit';
import { BackendAuthModule } from '@petradar/backend/auth';
import { MatchingModule } from '@petradar/backend/matching';
import { LocationPrivacyService, PrismaModule } from '@petradar/backend/shared';

import { LostPetsController } from './lost-pets.controller.js';
import { LostPetsService } from './lost-pets.service.js';

@Module({
  controllers: [LostPetsController],
  exports: [LostPetsService],
  imports: [AuditModule, BackendAuthModule, MatchingModule, PrismaModule],
  providers: [LocationPrivacyService, LostPetsService],
})
export class LostPetsModule {}
