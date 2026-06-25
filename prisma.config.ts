import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://petradar:petradar@localhost:5432/petradar?schema=public',
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
