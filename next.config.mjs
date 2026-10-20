import withSerwistInit from '@serwist/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // .pkpass generation uses Node APIs (fs, crypto) not available on the edge runtime.
  serverExternalPackages: ['passkit-generator'],
}

// Compiles src/app/sw.ts into public/sw.js at build time. Dev builds skip
// the service worker entirely (disable: true below) so `next dev` hot
// reload isn't fighting a worker serving stale cached chunks.
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist(nextConfig)
