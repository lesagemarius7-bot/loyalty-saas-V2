'use client'

import { useRouter } from 'next/navigation'
import { Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

// Full-screen block, not a banner over a degraded dashboard — a pending or
// rejected merchant has no loyalty_programs/customers of their own worth
// showing yet anyway, and showing real nav (Scanner, Clients, Programme…)
// that all 403 on click would be worse than just not showing it.
export function PendingApprovalScreen({ status }: { status: 'pending' | 'rejected' }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span
            className={
              status === 'pending'
                ? 'flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'
                : 'flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive'
            }
          >
            {status === 'pending' ? <Clock className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
          </span>

          {status === 'pending' ? (
            <>
              <h1 className="text-lg font-semibold">Demande en cours d’examen</h1>
              <p className="text-sm text-muted-foreground">
                Votre demande d’accès à la plateforme Loyalty est en cours d’examen par notre équipe. Vous recevrez
                un e-mail dès la validation de votre accès pour profiter de votre mois d’essai gratuit (POC 30
                jours).
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Demande non retenue</h1>
              <p className="text-sm text-muted-foreground">
                Votre demande d’accès à la plateforme Loyalty n’a pas été retenue. Si vous pensez qu’il s’agit d’une
                erreur, contactez-nous à contact@loyaltyapp.click.
              </p>
            </>
          )}

          <Button variant="outline" onClick={handleSignOut}>
            Déconnexion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
