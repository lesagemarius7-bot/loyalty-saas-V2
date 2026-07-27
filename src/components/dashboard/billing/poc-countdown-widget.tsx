import { Card, CardContent } from '@/components/ui/card'
import { computePocStatus } from '@/lib/billing/poc'

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PocCountdownWidget({
  pocStartDate,
  pocDurationDays,
}: {
  pocStartDate: string
  pocDurationDays: number
}) {
  const { daysRemaining, billingStartDate, progressPercentage, isOver } = computePocStatus(
    pocStartDate,
    pocDurationDays
  )

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-semibold">🎁 Période d’essai POC — {pocDurationDays === 60 ? '2 mois' : `${pocDurationDays} jours`} offerts</p>

        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            Début du POC : <span className="font-medium text-foreground">{formatDate(new Date(pocStartDate))}</span>
          </p>
          <p>
            Première facturation :{' '}
            <span className="font-medium text-foreground">{formatDate(billingStartDate)}</span>
          </p>
        </div>

        <div className="space-y-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {isOver ? 'Période d’essai terminée' : `${daysRemaining} jour(s) restant(s)`}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {isOver
            ? "Votre période d'essai est terminée — sélectionnez une formule ci-dessous pour continuer."
            : `Votre abonnement débutera automatiquement le ${formatDate(billingStartDate)}. Aucune carte bancaire n’est débitée pendant votre période d’essai.`}
        </p>
      </CardContent>
    </Card>
  )
}
