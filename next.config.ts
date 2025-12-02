import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

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

    // Use IgnorePlugin to completely skip these modules during bundling
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /@solana\/kit/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /@solana-program\/system/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /@react-native-async-storage\/async-storage/,
      })
    );

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
