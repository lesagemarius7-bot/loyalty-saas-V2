import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PLANS } from '@/lib/billing/plans'

// Public-facing rendering of the same PLANS data the dashboard's
// PlanSelector uses — same offers, same features, same prices, just a
// signup CTA instead of a live plan-switch action.
export function PricingCards() {
  return (
    <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-2">
      {PLANS.map((plan) => (
        <Card key={plan.id} className={cn(plan.recommended && 'border-primary shadow-md')}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{plan.label}</CardTitle>
              {plan.recommended && <Badge variant="accent">Recommandé</Badge>}
            </div>
            <CardDescription>{plan.tagline}</CardDescription>
            <p className="pt-4 text-3xl font-bold">
              {plan.price} € <span className="text-base font-normal text-muted-foreground">/ mois</span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/signup" className={buttonVariants({ className: 'w-full' })}>
              Essayer gratuitement
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
