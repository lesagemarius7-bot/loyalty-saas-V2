import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { DormantCustomerPlaybook } from '@/components/dashboard/playbooks/dormant-customer-playbook'
import { SmartEngagementPlaybook } from '@/components/dashboard/playbooks/smart-engagement-playbook'
import { RoadmapPlaybookCard } from '@/components/dashboard/playbooks/roadmap-playbook-card'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'
import { isWeatherConfigured } from '@/lib/weather/openweather'

// Same graceful defaults as /dashboard/card-design — a brand-new account (or
// one whose signup-time program insert failed) has no loyalty_programs row
// yet, so the page still has to render something editable instead of a blank
// screen or a crash.
const DEFAULT_THRESHOLD_DAYS = 30
const DEFAULT_MESSAGE = 'On ne vous a pas vu depuis un moment ! Revenez vite pour cumuler des points 🎁'

export default async function PlaybooksPage() {
  const { merchant, dataClient: supabase } = await getCurrentMerchant()

  try {
    const { data: program, error: programError } = await supabase
      .from('loyalty_programs')
      .select('inactivity_reminder_enabled, inactivity_threshold_days, inactivity_message, smart_engagement_enabled')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (programError) {
      console.error('[dashboard/playbooks] failed to fetch program', programError)
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Playbooks & Automatisation</h1>
          <p className="text-muted-foreground">
            Activez des scénarios marketing intelligents en un clic — aucune configuration technique requise.
          </p>
        </div>

        {programError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Impossible de charger la configuration existante ({programError.message}) — les réglages affichés
            ci-dessous sont des valeurs par défaut, pas votre configuration réelle.
          </p>
        )}

        <DormantCustomerPlaybook
          initialEnabled={program?.inactivity_reminder_enabled ?? false}
          initialThresholdDays={program?.inactivity_threshold_days ?? DEFAULT_THRESHOLD_DAYS}
          initialMessage={program?.inactivity_message ?? DEFAULT_MESSAGE}
        />

        <SmartEngagementPlaybook
          initialEnabled={program?.smart_engagement_enabled ?? false}
          weatherConfigured={isWeatherConfigured()}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <RoadmapPlaybookCard
            title="Dernière Ligne Droite"
            description="Envoie un message incitatif quand le client est à 1 ou 2 tampons de débloquer sa récompense."
            tooltip="Bientôt disponible — accélère le repeat business en relançant les clients proches de leur récompense."
          />
          <RoadmapPlaybookCard
            title="Boost Jour Creux"
            description="Propose des tampons doubles automatiquement les jours calmes (ex : le mardi)."
            tooltip="Bientôt disponible — lisse l’affluence en incitant les visites lors des périodes creuses."
          />
        </div>
      </div>
    )
  } catch (err) {
    console.error('[dashboard/playbooks] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger les playbooks"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}
