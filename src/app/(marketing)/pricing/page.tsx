import Link from 'next/link'
import { Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

const PLANS = [
  {
    name: 'Starter',
    price: '29€',
    period: '/mois',
    description: 'Pour un commerce qui démarre son programme de fidélité.',
    features: ['1 point de vente', 'Cartes Apple & Google Wallet', "Jusqu'à 500 clients", 'Support email'],
    priceIdEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER',
  },
  {
    name: 'Pro',
    price: '79€',
    period: '/mois',
    description: 'Pour les enseignes multi-sites avec plusieurs commerçants.',
    features: [
      'Points de vente illimités',
      'Cartes Apple & Google Wallet',
      'Clients illimités',
      'Comptes staff multiples',
      'Support prioritaire',
    ],
    priceIdEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO',
  },
]

export default function PricingPage() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Des tarifs simples, sans surprise</h1>
        <p className="mt-4 text-muted-foreground">14 jours d’essai gratuit, sans carte bancaire.</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl gap-8 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className={buttonVariants({ className: 'w-full' })}>
                Commencer
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
