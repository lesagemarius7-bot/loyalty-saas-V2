'use client'

import { useEffect, useState } from 'react'
import { Smartphone, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const DISMISSED_KEY = 'loyalty-pwa-banner-dismissed'

// Chrome/Edge/Android fire this instead of offering their own install UI,
// so the app can trigger it from a button that fits the page instead of
// waiting for the browser's own (easy to miss) address-bar icon. Not in
// lib.dom.d.ts — same pattern as BarcodeDetector elsewhere in this app.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari doesn't support the display-mode media query the same way
    // pre-iOS 16.4 — this is the older, iOS-specific signal.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

// Staff at the counter use this page all day — installing it as a
// standalone PWA means no address bar to accidentally tap, and a real icon
// on the till's home screen instead of hunting through browser tabs/history
// every shift.
export function InstallPwaBanner() {
  const [standalone, setStandalone] = useState(true) // assume installed until checked, to avoid a flash
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setStandalone(isStandalone())
    setIsIos(isIosDevice())
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  // Nothing to offer on desktop/unsupported browsers, already installed, or
  // dismissed — no banner rather than a dead-end one.
  if (standalone || dismissed || (!isIos && !deferredPrompt)) return null

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">📲 Installer le Scanner sur mon téléphone</p>
              <p className="text-xs text-muted-foreground">
                Accès en 1 tap depuis l’écran d’accueil, plein écran, sans barre d’adresse.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              onClick={isIos ? () => setIosGuideOpen(true) : handleAndroidInstall}
            >
              {isIos ? 'Voir comment faire' : 'Installer l’application'}
            </Button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {iosGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-guide-title"
          onClick={() => setIosGuideOpen(false)}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="space-y-4 py-6">
              <h2 id="ios-install-guide-title" className="text-center text-lg font-semibold">
                Installer sur votre iPhone
              </h2>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </span>
                <p className="pt-1 text-sm">
                  Appuyez sur l’icône de partage <Share className="inline h-4 w-4 align-text-bottom" /> en bas de
                  Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </span>
                <p className="pt-1 text-sm">
                  Faites défiler et appuyez sur <strong>« Sur l’écran d’accueil »</strong> (icône ➕).
                </p>
              </div>

              <Button className="w-full" onClick={() => setIosGuideOpen(false)}>
                Compris !
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
