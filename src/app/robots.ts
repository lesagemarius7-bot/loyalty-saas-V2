import type { MetadataRoute } from 'next'

const FALLBACK_APP_URL = 'https://loyaltyapp.click'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api', '/card', '/join', '/my-offers'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
