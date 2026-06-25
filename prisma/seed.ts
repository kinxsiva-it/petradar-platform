import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await argon2.hash('ChangeMe-PetRadar-Dev-Only-2026', {
    type: argon2.argon2id,
  });

  await prisma.user.upsert({
    where: { email: 'admin@petradar.local' },
    update: {
      displayName: 'Admin Nicha',
      roles: [UserRole.ADMIN],
    },
    create: {
      email: 'admin@petradar.local',
      displayName: 'Admin Nicha',
      passwordHash,
      roles: [UserRole.ADMIN],
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
