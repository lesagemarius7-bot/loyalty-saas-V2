import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, TrendingUp } from 'lucide-react'
import { SEO_INDUSTRIES, getSeoIndustry } from '@/data/seo-industries'
import { LoyaltyCardVisual } from '@/components/wallet/loyalty-card-visual'
import { RevenueSimulator } from '@/components/marketing/revenue-simulator'
import { PromoVideoSection } from '@/components/marketing/promo-video-section'
import { BookDemoButton } from '@/components/marketing/book-demo-button'
import { buttonVariants } from '@/components/ui/button'

// Same fallback pattern as the API routes (see e.g.
// src/app/api/auth/signup/route.ts) — the verified custom domain, not the
// Vercel preview URL, for canonical/OG URLs even if NEXT_PUBLIC_APP_URL
// isn't set in a given environment.
const FALLBACK_APP_URL = 'https://loyaltyapp.click'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL

// A curated set of 20 trades, not an open namespace — any other slug 404s
// instead of being server-rendered on demand. Programmatic SEO pages work
// because each one is deliberately written (see seo-industries.ts), not
// because the route accepts arbitrary input.
export const dynamicParams = false

export function generateStaticParams() {
  return SEO_INDUSTRIES.map((industry) => ({ metier: industry.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }): Promise<Metadata> {
  const { metier } = await params
  const industry = getSeoIndustry(metier)
  if (!industry) return {}

  const url = `${APP_URL}/solutions/${industry.slug}`
  const title = `Carte de fidélité digitale pour ${industry.pluralName.toLowerCase()}`
  const description = `Offrez une carte de fidélité Wallet à vos clients ${industry.pluralName.toLowerCase()}. ${industry.rewardExample}, notifications sur écran verrouillé, zéro carte en carton. Essai gratuit.`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Loyalty',
      locale: 'fr_FR',
      type: 'website',
      images: [{ url: `${APP_URL}/branding/loyalty-logo-horizontal.png`, width: 405, height: 200, alt: 'Loyalty' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function IndustryPage({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  const industry = getSeoIndustry(metier)
  if (!industry) notFound()

  const url = `${APP_URL}/solutions/${industry.slug}`
  const otherIndustries = SEO_INDUSTRIES.filter((i) => i.slug !== industry.slug)

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Loyalty',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android, Web',
    url,
    description: `Carte de fidélité digitale en marque blanche pour ${industry.pluralName.toLowerCase()}, logée dans Apple Wallet et Google Wallet — zéro application à télécharger.`,
    offers: {
      '@type': 'Offer',
      price: '49',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '49',
        priceCurrency: 'EUR',
        billingDuration: 'P1M',
      },
    },
  }

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: industry.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />

      {/* Hero */}
      <section className="container overflow-x-hidden py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Loyalty pour {industry.pluralName.toLowerCase()}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              La carte de fidélité que vos clients gardent vraiment
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {industry.painPoints[0]} Avec Loyalty, votre carte vit directement dans l’Apple Wallet et le Google
              Wallet de vos clients — <strong>{industry.rewardExample.toLowerCase()}</strong>, zéro carte en carton,
              zéro application à télécharger.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
                Essayer gratuitement
              </Link>
              <BookDemoButton variant="outline" size="lg" />
            </div>

            <ul className="mt-10 space-y-3">
              {industry.painPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <LoyaltyCardVisual
              businessName={industry.name}
              subtitle="Carte de fidélité"
              backgroundColor={industry.cardColor}
              textColor={industry.cardTextColor}
              pointsBalance={Math.max(1, Math.round(industry.rewardThreshold * 0.6))}
              rewardThreshold={industry.rewardThreshold}
              rewardDescription={industry.rewardExample}
              stampIcon={industry.stampIcon}
              serialNumber="LOY-DEMO01"
              walletStyle="apple"
            />
          </div>
        </div>
      </section>

      {/* Revenue simulator */}
      <section className="border-y border-border bg-secondary/40 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Le calcul, pas la promesse</h2>
            <p className="mt-4 text-muted-foreground">
              Un ordre de grandeur basé sur la réalité de votre {industry.name.toLowerCase()}, pas un chiffre
              générique.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <RevenueSimulator defaultTicket={industry.averageTicket} defaultVisits={industry.monthlyVisits} />
          </div>
        </div>
      </section>

      {/* Push examples */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Des notifications qui ressemblent à votre métier</h2>
          <p className="mt-4 text-muted-foreground">
            Trois exemples de notifications envoyées directement sur l’écran verrouillé de vos clients{' '}
            {industry.pluralName.toLowerCase()}.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-3">
          {industry.pushExamples.map((push) => (
            <div key={push.message} className="rounded-2xl border border-border bg-foreground/95 p-4 text-background shadow-lg">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm" aria-hidden>
                  {industry.stampIcon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide opacity-70">{industry.name}</p>
                  <p className="text-sm leading-snug">{push.message}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-accent">{push.estimatedOpenRate}</p>
            </div>
          ))}
        </div>
      </section>

      <PromoVideoSection />

      {/* FAQ */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Questions fréquentes — {industry.pluralName}</h2>
        </div>
        <div className="mx-auto mt-10 max-w-2xl space-y-3">
          {industry.faq.map((item) => (
            <details key={item.question} className="group rounded-lg border border-border bg-card p-5 open:shadow-sm">
              <summary className="cursor-pointer list-none text-sm font-semibold marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Internal mesh — other trades */}
      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="container">
          <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Loyalty s’adapte aussi à ces métiers
          </p>
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
            {otherIndustries.map((other) => (
              <Link
                key={other.slug}
                href={`/solutions/${other.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                <span aria-hidden>{other.stampIcon}</span>
                {other.pluralName}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Prêt à équiper votre {industry.name.toLowerCase()} ?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Créez votre carte en quelques minutes, sans engagement pendant votre période d’essai.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
            Essayer gratuitement
          </Link>
          <BookDemoButton variant="outline" size="lg" />
        </div>
      </section>
    </>
  )
}
