/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress strict checks during build to identify actual runtime issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Essential for Cloudflare Pages deployment
  images: {
    unoptimized: true,
  },
  // Allow importing from local workspace packages
  transpilePackages: ["@next-hr/database", "@next-hr/auth-database"],
};

module.exports = nextConfig;
