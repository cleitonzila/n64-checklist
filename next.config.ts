import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  serverExternalPackages: ['@prisma/client', '@prisma/client-n64', '@prisma/adapter-neon'],
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // Prevent duplicate WASM module declarations
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    return config;
  },
};

export default nextConfig;
