/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pino-pretty',
    'lokijs',
    'encoding',
    '@walletconnect/keyvaluestorage',
    'idb-keyval',
  ],
  webpack: (config, { isServer }) => {
    // External modules that shouldn't be bundled
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Fix for MetaMask SDK trying to import React Native modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    // Ignore React Native modules in webpack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    // Handle browser-only modules during SSR
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // External WalletConnect packages that use browser APIs
      config.externals.push({
        '@walletconnect/keyvaluestorage': 'commonjs @walletconnect/keyvaluestorage',
        'idb-keyval': 'commonjs idb-keyval',
      });
    }

    return config;
  },
};

export default nextConfig;
