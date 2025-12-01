import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Polyfills for client-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      pino: false,
      'pino-pretty': false,
    };

    // Ignore pino and thread-stream on client side (not needed in browser)
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
