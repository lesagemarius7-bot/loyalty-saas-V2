import { POC_DURATION_DAYS } from '@/lib/billing/plans'

export function PocBanner() {
  return (
    <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary/5 px-6 py-4 text-center">
      <p className="text-sm font-semibold">
        🎁 {POC_DURATION_DAYS} jours offerts sur les deux formules
      </p>
      <p className="text-xs text-muted-foreground">
        Aucune carte bancaire requise. Choisissez votre formule, testez-la grandeur nature, changez d’avis à tout
        moment pendant votre essai.
      </p>
    </div>
  )
}
