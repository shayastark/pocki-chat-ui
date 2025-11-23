/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Speed up production builds
  productionBrowserSourceMaps: false,
  experimental: {
    optimizeCss: false, // Disable CSS optimization that can be slow
  },
  // Allow external images from Neynar CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        '@react-native-async-storage/async-storage': false,
      };
    }

    // Speed up builds
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.moduleIds = 'deterministic';
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' https://challenges.cloudflare.com 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://imagedelivery.net;
              font-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self' https://farcaster.xyz https://client.farcaster.xyz https://warpcast.com https://client.warpcast.com https://base.app;
              child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://farcaster.xyz https://base.app;
              frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://farcaster.xyz https://base.app;
              connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://xmtp.network https://*.xmtp.network wss://*.xmtp.network https://mainnet.base.org https://base.drpc.org https://rpc.ankr.com https://base-mainnet.g.alchemy.com https://imagedelivery.net https://eth.merkle.io;
              worker-src 'self' blob:;
              manifest-src 'self'
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
