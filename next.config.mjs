/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable linting but keep TypeScript checks separate (vite plugin conflicts)
  eslint: {
    ignoreDuringBuilds: false, // Enable linting for better code quality
  },
  typescript: {
    ignoreBuildErrors: true, // TypeScript checked separately (vite type conflicts)
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development', // Optimize images in production
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize production build
  poweredByHeader: false,
  compress: true,
}

export default nextConfig
