import { Module } from '@nestjs/common';

import { PrismaModule } from '@petradar/backend/shared';

import { UsersRepository } from './users.repository.js';

@Module({
  exports: [UsersRepository],
  imports: [PrismaModule],
  providers: [UsersRepository],
})
export class BackendUsersModule {}
