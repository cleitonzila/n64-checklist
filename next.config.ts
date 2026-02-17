import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  serverExternalPackages: ['@prisma/client', '@prisma/client-n64', '@prisma/adapter-neon'],
};

export default nextConfig;
