'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'

// Scoped to the (dashboard) route group — catches errors from the sidebar
// layout and every /dashboard/* page without tearing down the marketing/auth/
// wallet routes elsewhere in the app. If the sidebar itself is what threw, we
// can't rely on it still being on screen, so this offers its own way back in.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Le tableau de bord a rencontré une erreur</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Réessayez, ou retournez à la vue d’ensemble si le problème persiste.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          Vue d’ensemble
        </Link>
      </div>
    </div>
  )
}
