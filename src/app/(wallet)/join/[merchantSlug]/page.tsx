import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { EnrollForm } from '@/components/wallet/enroll-form'

export default async function JoinPage({ params }: { params: Promise<{ merchantSlug: string }> }) {
  const { merchantSlug } = await params
  const supabase = createServiceRoleClient()

  const { data: merchant } = await supabase
    .from('merchants')
    .select('business_name, slug, brand_color, logo_url')
    .eq('slug', merchantSlug)
    .single()

  if (!merchant) notFound()

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {merchant.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={merchant.logo_url} alt={merchant.business_name} className="mb-2 h-10 object-contain" />
          )}
          <CardTitle>{merchant.business_name}</CardTitle>
          <CardDescription>Rejoignez le programme de fidélité pour gagner des points à chaque visite.</CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollForm merchantSlug={merchant.slug} brandColor={merchant.brand_color} />
        </CardContent>
      </Card>
    </div>
  )
}
