import type { MetadataRoute } from 'next'
import { SEO_INDUSTRIES } from '@/data/seo-industries'

// Same fallback pattern as the API routes and the /solutions/[metier]
// metadata (see src/app/api/auth/signup/route.ts) — the verified custom
// domain even if NEXT_PUBLIC_APP_URL isn't set in a given environment.
const FALLBACK_APP_URL = 'https://loyaltyapp.click'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL

// Static marketing routes worth indexing — dashboard/admin/wallet routes are
// either behind auth or per-customer (no fixed URL to list), so they stay
// out of the sitemap on purpose.
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/signup', priority: 0.6, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // One entry per métier — this is what keeps the sitemap in sync with
  // seo-industries.ts automatically: add a 21st industry there and it shows
  // up here on the next build with no further change needed.
  const industryEntries: MetadataRoute.Sitemap = SEO_INDUSTRIES.map((industry) => ({
    url: `${APP_URL}/solutions/${industry.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  return [...staticEntries, ...industryEntries]
}
