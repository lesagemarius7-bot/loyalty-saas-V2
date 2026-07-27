import Link from 'next/link'
import { AlarmClock, Bell, MapPin, PartyPopper, QrCode, Repeat, Send, Smartphone, Target } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PricingCards } from '@/components/marketing/pricing-cards'
import { PocBanner } from '@/components/marketing/poc-banner'
import { AnimatedWalletCards } from '@/components/marketing/animated-wallet-cards'

const REASSURANCE_BADGES = [
  { emoji: '⚡', label: '100% Marque Blanche' },
  { emoji: '📲', label: '0 App à télécharger (1-Click QR Code)' },
  { emoji: '🔔', label: 'Notifications Push & Géolocalisation' },
]

const VALUE_PROPS = [
  {
    icon: Repeat,
    title: 'Fidélisation passive ➔ active',
    description:
      "Fini les cartes papier perdues et la friction des applications lourdes — 80% des apps de fidélité sont abandonnées après le premier usage.",
  },
  {
    icon: Send,
    title: 'Canal de communication direct',
    description:
      'Réengagez vos clients sans dépenser en SMS ou emails coûteux grâce aux notifications Wallet, directement sur leur écran verrouillé.',
  },
]

const CRM_FEATURES = [
  {
    icon: PartyPopper,
    title: 'Notifications saisonnières & événementielles',
    description: 'Offres de rentrée, opérations spéciales, ventes privées.',
  },
  {
    icon: AlarmClock,
    title: 'Relance automatique d’inactivité',
    description: 'Envoi d’une notification si le client ne s’est pas présenté depuis 30 jours.',
  },
  {
    icon: Target,
    title: 'Offres ciblées selon l’historique d’achat',
    description: 'Récompenses personnalisées selon les habitudes de visite.',
  },
  {
    icon: MapPin,
    title: 'Geofencing discret',
    description: 'Notification contextuelle quand le client passe à proximité de la boutique.',
  },
]

const STEPS = [
  {
    number: '01',
    icon: QrCode,
    title: 'Inscription Express',
    description: 'Le client scanne un QR code au comptoir.',
  },
  {
    number: '02',
    icon: Smartphone,
    title: 'Ajout en 1 Clic',
    description: 'La carte s’installe dans Apple Wallet ou Google Wallet sans téléchargement.',
  },
  {
    number: '03',
    icon: Bell,
    title: 'Tampons & Relances',
    description: 'Tamponnage instantané en caisse et notifications intelligentes automatisées.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container overflow-x-hidden py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          La carte de fidélité de votre commerce, directement dans la poche de vos clients.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Créez votre propre carte Wallet 100% en marque blanche. Zéro application à télécharger, un nouveau canal
          marketing puissant directement sur l’écran verrouillé de vos clients.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {REASSURANCE_BADGES.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              <span aria-hidden>{badge.emoji}</span>
              {badge.label}
            </span>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
            Essayer gratuitement
          </Link>
          <Link href="/pricing" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Voir les tarifs
          </Link>
        </div>

        <div className="mt-16">
          <AnimatedWalletCards />
        </div>
      </section>

      {/* Pourquoi Loyalty ? */}
      <section className="container pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pourquoi Loyalty ?</h2>
          <p className="mt-4 text-muted-foreground">
            La fidélité client mérite mieux qu’une carte tamponnée qui prend la poussière au fond d’un portefeuille.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {VALUE_PROPS.map((prop) => (
            <Card key={prop.title}>
              <CardHeader>
                <prop.icon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">{prop.title}</CardTitle>
                <CardDescription>{prop.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Un canal marketing & CRM dynamique */}
      <section className="border-y border-border bg-secondary/40 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Un canal marketing & CRM dynamique</h2>
            <p className="mt-4 text-muted-foreground">
              Chaque carte Wallet devient un point de contact permanent avec vos clients — sans coût par message,
              sans app tierce.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {CRM_FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-2 text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche ? */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Comment ça marche ?</h2>
          <p className="mt-4 text-muted-foreground">Trois étapes, zéro friction.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Étape {step.number}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
            Essayer gratuitement
          </Link>
        </div>
      </section>

      {/* Offres & POC 2 mois offerts */}
      <section className="border-t border-border bg-secondary/40 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Des tarifs simples, sans surprise</h2>
            <p className="mt-4 text-muted-foreground">
              Deux formules, une seule décision : passive ou pilotée par l’IA.
            </p>
          </div>

          <div className="mt-12">
            <PocBanner />
            <PricingCards />
          </div>
        </div>
      </section>
    </>
  )
}
