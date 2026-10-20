/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// Scoped to /dashboard/ only (see register-service-worker.tsx and the
// manifest's `scope`) — this keeps the service worker off the customer-facing
// wallet/checkout pages, where stale cached HTML around a payment or a
// points balance would be worse than no cache at all. defaultCache only ever
// intercepts GET requests (Workbox/Serwist strategies pass POST/PUT straight
// to the network), so the scan page's point-adding calls are never cached
// even though they're same-origin.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
