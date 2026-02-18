import { PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaClientPS1 } from 'prisma-ps1-client';
import { PrismaClient as PrismaClientN64 } from 'prisma-n64-client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaPs1: PrismaClientPS1;
  prismaN64: PrismaClientN64;
};

// Auth Client (Default)
export const prisma = globalForPrisma.prisma || new PrismaClient();

// PS1 Client
export const prismaPs1 = globalForPrisma.prismaPs1 || new PrismaClientPS1();

// N64 Client
export const prismaN64 = globalForPrisma.prismaN64 || new PrismaClientN64();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPs1 = prismaPs1;
  globalForPrisma.prismaN64 = prismaN64;
}

export default prisma;
