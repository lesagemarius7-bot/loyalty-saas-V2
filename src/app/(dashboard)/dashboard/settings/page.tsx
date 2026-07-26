import Link from 'next/link'
import { getCurrentMerchant } from '@/lib/get-current-merchant'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default async function SettingsPage() {
  const { merchant } = await getCurrentMerchant()
  const enrollmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${merchant.slug}`

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-muted-foreground">
          Le logo, les couleurs et le rendu de la carte se règlent depuis{' '}
          <Link href="/dashboard/card-design" className="text-primary underline">
            Design de la carte
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lien d’inscription</CardTitle>
          <CardDescription>Partagez ce lien avec vos clients (QR code en caisse, réseaux sociaux…).</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block truncate rounded-md bg-secondary px-3 py-2 text-sm">{enrollmentUrl}</code>
        </CardContent>
      </Card>
    </div>
  )
}
