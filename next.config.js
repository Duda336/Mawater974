/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['eyhpjdnfeetmlayyxshx.supabase.co'],
    unoptimized: true, // Disable Next.js image optimization
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    forceSwcTransforms: true,
    swcMinify: true,
  },
  onError: () => {},
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      checkWasmTypes: false,
    }
    return config
  },
  reactStrictMode: true,
  // Vercel-specific configurations
  vercel: {
    skipFailedBuilds: true,
  }
};

module.exports = nextConfig;
