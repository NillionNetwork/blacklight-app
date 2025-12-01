import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Polyfills and fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      pino: false,
      'pino-pretty': false,
    };

    // Ignore optional dependencies (both client and server)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Solana dependencies (not needed for Ethereum-only app)
      '@solana/kit': false,
      '@solana-program/system': false,
    };

    // Additional client-side ignores
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        pino: false,
        'pino-pretty': false,
        'thread-stream': false,
      };
    }

    return config;
  },
  transpilePackages: [
    '@walletconnect/ethereum-provider',
    '@walletconnect/universal-provider',
  ],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Set turbopack root to fix lockfile warning
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
