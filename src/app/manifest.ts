import type { MetadataRoute } from 'next'

// Next.js App Router file convention — auto-served at /manifest.webmanifest
// with the correct content-type, no route handler needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Loyalty Scanner — Caisse',
    short_name: 'Loyalty Scan',
    description: 'Scanner de cartes de fidélité pour commerçants',
    // Real route — /dashboard/scanner doesn't exist in this app, the actual
    // page is /dashboard/scan.
    start_url: '/dashboard/scan',
    display: 'standalone',
    // Dark splash-screen background regardless of the app's own light theme
    // (standard PWA practice); theme_color is the real brand color sampled
    // from the Loyalty logo (see globals.css's --primary comment), not a
    // guess.
    background_color: '#0f172a',
    theme_color: '#453ee8',
    // Next.js's manifest type only allows one `purpose` value per entry
    // (unlike the raw web manifest spec, which accepts a space-separated
    // "any maskable") — same icon listed twice to cover both.
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
