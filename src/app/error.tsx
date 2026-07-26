'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'

// Root-segment error boundary — Next.js requires this file (App Router
// convention) to catch rendering errors anywhere under the root layout that
// aren't already handled by a more specific error.tsx closer to the segment
// that threw. Without it, Next falls back to an internal placeholder and logs
// "missing required error components, refreshing...".
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Quelque chose s’est mal passé. Réessayez, ou revenez à l’accueil si le problème persiste.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}
