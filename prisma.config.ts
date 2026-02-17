import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export default defineConfig({
  datasource: {
    url: (process.env.PRISMA_DB_URL || process.env.DATABASE_URL) as string,
  },
  migrations: {
    // Usamos tsx para rodar o arquivo TypeScript diretamente
    seed: 'npx tsx ./prisma/seed.ts',
  },
});