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

export default nextConfig
