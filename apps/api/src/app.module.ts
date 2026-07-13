import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuditModule } from '@petradar/backend/audit';
import { AdminModule } from '@petradar/backend/admin';
import { AnalyticsModule } from '@petradar/backend/analytics';
import { LostPetsModule } from '@petradar/backend/lost-pets';
import { MapModule } from '@petradar/backend/map';
import { MatchingModule } from '@petradar/backend/matching';
import { NotificationsModule } from '@petradar/backend/notifications';
import { RescueCasesModule } from '@petradar/backend/rescue-cases';
import { SightingsModule } from '@petradar/backend/sightings';
import { BackendUsersModule } from '@petradar/backend/users';
import { globalApiRateLimit } from '@petradar/backend/shared';

import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { validateEnv } from './config/env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([globalApiRateLimit]),
    HealthModule,
    AdminModule,
    AnalyticsModule,
    AuthModule,
    LostPetsModule,
    MapModule,
    MatchingModule,
    NotificationsModule,
    RescueCasesModule,
    UsersModule,
    BackendUsersModule,
    SightingsModule,
    AuditModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
