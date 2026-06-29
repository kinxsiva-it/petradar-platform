import { Injectable } from '@nestjs/common';
import { AccountStatus, Prisma, User, UserRole, VolunteerVerificationState } from '@prisma/client';

import { PrismaService } from '@petradar/backend/shared';

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
  phone?: string | null;
  roles?: UserRole[];
  status?: AccountStatus;
  volunteerVerification?: VolunteerVerificationState;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  create(input: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        displayName: input.displayName,
        email: this.normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        phone: input.phone,
        roles: input.roles ?? [UserRole.REPORTER],
        status: input.status ?? AccountStatus.ACTIVE,
        volunteerVerification:
          input.volunteerVerification ?? VolunteerVerificationState.NOT_APPLICABLE,
      } satisfies Prisma.UserCreateInput,
    });
  }
}
