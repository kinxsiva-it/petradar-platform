import { Module } from '@nestjs/common';

import { BackendAuthModule } from '@petradar/backend/auth';

import { AuthController } from './auth.controller.js';

@Module({
  controllers: [AuthController],
  imports: [BackendAuthModule],
})
export class AuthModule {}
