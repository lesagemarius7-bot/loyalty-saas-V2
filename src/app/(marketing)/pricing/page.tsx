import { PricingCards } from '@/components/marketing/pricing-cards'
import { PocBanner } from '@/components/marketing/poc-banner'

export default function PricingPage() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Des tarifs simples, sans surprise</h1>
        <p className="mt-4 text-muted-foreground">Deux formules, une seule décision : passive ou pilotée par l’IA.</p>
      </div>

      <div className="mt-12">
        <PocBanner />
        <PricingCards />
      </div>
    </section>
  )
}
