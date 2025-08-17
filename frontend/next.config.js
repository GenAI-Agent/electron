/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use export mode in production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    distDir: 'out',
    assetPrefix: './',
  }),
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig
