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
    // Matches the service worker's registration scope (register-service-worker.tsx)
    // — keeps the installed app's navigation boundary to the merchant
    // dashboard, away from customer-facing wallet/checkout pages.
    scope: '/dashboard/',
    display: 'standalone',
    // Dark splash-screen background regardless of the app's own light theme
    // (standard PWA practice); theme_color is the real brand color sampled
    // from the Loyalty logo (see globals.css's --primary comment), not a
    // guess.
    background_color: '#0f172a',
    theme_color: '#453ee8',
    // Separate files for 'any' vs 'maskable': the plain icon-*.png run
    // edge-to-edge (fine for 'any', where the OS never crops them), but a
    // maskable icon gets cropped to a circle/squircle/rounded-square by the
    // OS, so it needs its own variant with the logo scaled down and
    // centered inside the safe zone (generated via scripts/ — see
    // icon-*-maskable.png).
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
