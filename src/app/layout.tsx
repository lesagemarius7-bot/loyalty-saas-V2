import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Loyalty — le canal marketing dans le Wallet de vos clients',
    template: '%s · Loyalty',
  },
  description:
    'Loyalty est le canal marketing direct et intelligent en marque blanche, logé dans Apple Wallet et Google Wallet — carte de fidélité pour restaurateurs et commerçants, zéro application à télécharger.',
  // Home-screen label/behavior when installed as a PWA (iOS reads these
  // regardless of the manifest, which Safari otherwise ignores more of than
  // Chrome does) — distinct from the page <title> above.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Loyalty Scan',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
