import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { PrismaClient as PrismaClientN64 } from '@prisma/client-n64';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const connectionStringN64 = process.env.N64_DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaN64: any | undefined;
};

const adapter = new PrismaNeon({ connectionString });
const adapterN64 = new PrismaNeon({ connectionString: connectionStringN64 });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

export const prismaN64 =
  globalForPrisma.prismaN64 ??
  new PrismaClientN64({ adapter: adapterN64 });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaN64 = prismaN64;
}

export default prisma;
