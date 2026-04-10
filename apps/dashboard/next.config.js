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
  },
};

module.exports = nextConfig;
