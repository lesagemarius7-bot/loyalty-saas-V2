'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Scope explicitly narrowed to /dashboard/ — the service worker file lives
// at the site root (so Next can serve it from /sw.js), which would let it
// control every route by default. Narrowing is always allowed (widening
// isn't, without a Service-Worker-Allowed header), and keeps caching away
// from the customer-facing wallet/checkout/marketing pages that share this
// origin. Matches manifest.ts's `scope`.
export function RegisterServiceWorker() {
  // sw.ts runs Serwist with skipWaiting+clientsClaim, so a new deploy takes
  // over an already-open tab immediately instead of waiting for a manual
  // reload — good for always serving the latest scanner, but it means the
  // page's already-loaded JS chunks can go stale mid-session. This banner is
  // the other half: it surfaces that swap so the merchant can reload
  // between scans instead of hitting a surprise chunk-load error later.
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // A 'controllerchange' fires both the first time this page comes under
    // the service worker's control AND whenever a later deploy replaces it.
    // Only the second case is an "update" worth telling the merchant about —
    // distinguished by whether a controller already existed before this
    // effect registered anything.
    const hadController = Boolean(navigator.serviceWorker.controller)

    function handleControllerChange() {
      if (hadController) setUpdateAvailable(true)
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register('/sw.js', { scope: '/dashboard/' })
      .catch((err) => console.error('[sw] registration failed', err))

    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }, [])

  if (!updateAvailable) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-full max-w-sm px-4">
      <Card className="border-primary/30 bg-primary/5 shadow-lg">
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-medium">Nouvelle version disponible</p>
          </div>
          <Button size="sm" onClick={() => window.location.reload()}>
            Recharger
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
