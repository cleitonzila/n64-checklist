import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { PrismaClient as PrismaClientN64 } from '@prisma/client-n64';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaN64: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

export const prismaN64 =
  globalForPrisma.prismaN64 ??
  new PrismaClientN64();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaN64 = prismaN64;
}

export default prisma;
