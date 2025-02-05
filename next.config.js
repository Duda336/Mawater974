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
  reactStrictMode: true,
  swcMinify: true,
  
  // Vercel-specific configurations
  vercel: {
    // Skip build errors and continue deployment
    skipFailedBuilds: true,
  }
};

module.exports = nextConfig;
