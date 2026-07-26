import Link from 'next/link'
import { Wallet, QrCode, LineChart } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Wallet,
    title: 'Apple Wallet & Google Wallet',
    description:
      "Vos clients ajoutent leur carte de fidélité en un tap, sans app à installer. Le solde se met à jour automatiquement sur leur téléphone.",
  },
  {
    icon: QrCode,
    title: 'Scan en caisse',
    description:
      'Votre équipe scanne le QR code du client depuis un simple navigateur — sur tablette, mobile ou ordinateur — pour créditer des points instantanément.',
  },
  {
    icon: LineChart,
    title: 'Dashboard commerçant',
    description:
      'Suivez vos clients, leur activité et la performance de votre programme de fidélité en temps réel, avec votre marque et vos couleurs.',
  },
]

export default function LandingPage() {
  return (
    <>
      <section className="container py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          La carte de fidélité de votre commerce, dans la poche de vos clients
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Plateforme en marque blanche pour restaurateurs et commerçants : cartes Apple Wallet
          et Google Wallet, scan en caisse, et dashboard pour suivre vos clients.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
            Essayer gratuitement
          </Link>
          <Link href="/pricing" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Voir les tarifs
          </Link>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </>
  )
}
