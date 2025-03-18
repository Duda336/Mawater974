/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['eyhpjdnfeetmlayyxshx.supabase.co'],
    unoptimized: true
  },
  compiler: {
    removeConsole: false
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRError: false
  }
};

module.exports = nextConfig;
