import { createClient } from '@/lib/supabase/server'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CampaignForm } from '@/components/dashboard/campaign-form'

export default async function CampaignsPage() {
  const { merchant } = await getCurrentMerchant()
  const supabase = await createClient()

  const { data: program } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('merchant_id', merchant.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Programme de fidélité</h1>
        <p className="text-muted-foreground">Définissez les règles d’attribution de points.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Règles</CardTitle>
          <CardDescription>Ces règles s’appliquent à toutes les cartes de vos clients.</CardDescription>
        </CardHeader>
        <CardContent>{program && <CampaignForm program={program} />}</CardContent>
      </Card>
    </div>
  )
}
