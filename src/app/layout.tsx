import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Loyalty — cartes de fidélité digitales',
    template: '%s · Loyalty',
  },
  description:
    'Plateforme en marque blanche de cartes de fidélité pour restaurateurs et commerçants, compatible Apple Wallet et Google Wallet.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
