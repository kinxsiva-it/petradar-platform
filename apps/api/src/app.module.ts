import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
  ],
})
export class AppModule {}
