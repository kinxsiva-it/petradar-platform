import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '@petradar/backend/audit';
import { SightingsModule } from '@petradar/backend/sightings';
import { BackendUsersModule } from '@petradar/backend/users';

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
    HealthModule,
    AuthModule,
    UsersModule,
    BackendUsersModule,
    SightingsModule,
    AuditModule,
  ],
})
export class AppModule {}
