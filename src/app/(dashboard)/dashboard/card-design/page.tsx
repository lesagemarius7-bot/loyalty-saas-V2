import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { LoyaltyCardCustomizer } from '@/components/dashboard/loyalty-card-customizer'
import { DashboardErrorFallback } from '@/components/dashboard/dashboard-error-fallback'
import type { LoyaltyProgram, Merchant } from '@/types'

// Sensible defaults for a brand-new account that hasn't saved a card design yet
// (or whose loyalty_programs row failed to get created at signup) — the
// customizer must always render something editable, never a blank screen.
const DEFAULT_PROGRAM_FIELDS = {
  name: 'Carte de fidélité',
  points_per_euro: 1,
  reward_threshold: 10,
  reward_description: 'Récompense offerte',
  stamp_icon: '✓',
  is_active: true,
  inactivity_reminder_enabled: false,
  inactivity_threshold_days: 30,
  inactivity_message: 'On ne vous a pas vu depuis un moment ! Revenez vite pour cumuler des points 🎁',
  smart_engagement_enabled: false,
  background_style: 'solid',
  gradient_secondary_color: '#0f172a',
  banner_image_url: null,
  back_address: null,
  back_phone: null,
  back_hours: null,
  back_instagram_url: null,
  back_google_review_url: null,
  back_terms: '1 tampon par passage en caisse.',
  latitude: null,
  longitude: null,
} as const

export default async function CardDesignPage() {
  const { merchant } = await getCurrentMerchant()

  try {
    const supabase = await createClient()

    const { data: program, error: programError } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (programError) {
      console.error('[dashboard/card-design] failed to fetch program', programError)
    }

    // Guards against empty strings too, not just missing rows — a merchant row
    // created before brand_color/card_text_color had defaults, or edited to '',
    // should still produce a usable preview instead of an invisible white-on-white
    // card.
    const safeMerchant: Merchant = {
      ...merchant,
      business_name: merchant.business_name || 'Mon commerce',
      brand_color: merchant.brand_color || '#1e293b',
      card_text_color: merchant.card_text_color || '#ffffff',
    }

    const effectiveProgram: LoyaltyProgram = program ?? {
      id: '',
      merchant_id: merchant.id,
      created_at: merchant.created_at,
      ...DEFAULT_PROGRAM_FIELDS,
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Design de la carte</h1>
          <p className="text-muted-foreground">
            Personnalisez l’apparence de votre carte de fidélité et prévisualisez le rendu en temps réel.
          </p>
        </div>

        {programError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Impossible de charger la configuration existante ({programError.message}) — les réglages affichés
            ci-dessous sont des valeurs par défaut, pas votre configuration réelle.
          </p>
        )}

        <LoyaltyCardCustomizer merchant={safeMerchant} program={effectiveProgram} isNewProgram={!program} />
      </div>
    )
  } catch (err) {
    console.error('[dashboard/card-design] unexpected render error', err)
    return (
      <DashboardErrorFallback
        title="Impossible de charger le design de la carte"
        message="Une erreur inattendue est survenue pendant le chargement de cette page. Réessayez dans un instant."
      />
    )
  }
}
