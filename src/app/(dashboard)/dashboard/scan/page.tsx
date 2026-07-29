'use client'

import { useEffect, useRef, useState } from 'react'
import type { Html5QrcodeScanner } from 'html5-qrcode'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InstallPwaBanner } from '@/components/dashboard/scan/install-pwa-banner'

type ScanState = 'idle' | 'scanning' | 'unsupported' | 'permission-denied'

const READER_ELEMENT_ID = 'qr-reader'

// html5-qrcode instead of window.BarcodeDetector — BarcodeDetector doesn't
// exist on iOS Safari at all (any version, including inside a PWA), which
// made the camera scanner unusable on iPhone, forcing manual entry for
// every single scan. html5-qrcode uses plain getUserMedia + in-JS decoding
// (zxing under the hood), which works identically across iOS Safari,
// Android Chrome, and installed-PWA contexts. Loaded dynamically (not a
// top-level import) since it touches the DOM directly and has no meaningful
// SSR path — this page is already 'use client', but the library itself
// still shouldn't be pulled into the initial bundle eval before mount.
export default function ScanPage() {
  const [state, setState] = useState<ScanState>('idle')
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [manualSerial, setManualSerial] = useState('')
  const [points, setPoints] = useState(10)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }

    let cancelled = false

    async function start() {
      const { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

      // getCameras() itself triggers the permission prompt — checking here,
      // before constructing the full scanner widget, is what lets us show
      // our own clear message instead of the library's generic one.
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (cancelled) return
        if (!cameras || cameras.length === 0) {
          setState('permission-denied')
          return
        }
      } catch (err) {
        console.error('[scan] camera permission/detection failed', err)
        if (!cancelled) setState('permission-denied')
        return
      }

      if (cancelled) return

      const scanner = new Html5QrcodeScanner(
        READER_ELEMENT_ID,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        false
      )

      scanner.render(
        (decodedText) => {
          // The QR payload is normally the card's raw serial_number (no
          // slashes), so this is a no-op passthrough for the real case —
          // but also handles a QR that encodes a full URL (e.g. the Smart
          // Link) by taking the last path segment instead.
          const parts = decodedText.split('/')
          const extracted = parts[parts.length - 1] || decodedText
          setLastResult(extracted)
        },
        () => {
          // Fires continuously while aiming at anything that isn't a valid
          // QR code yet — expected noise, not a real error.
        }
      )

      scannerRef.current = scanner
      if (!cancelled) setState('scanning')
    }

    start()

    return () => {
      cancelled = true
      scannerRef.current
        ?.clear()
        .catch((err) => console.error('[scan] failed to clear scanner', err))
      scannerRef.current = null
    }
  }, [])

  async function creditPoints(serialNumber: string) {
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNumber, points, type: 'earn' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setFeedback(`✅ ${points} points crédités — nouveau solde : ${data.pointsBalance}`)
    } catch (err) {
      setFeedback(`❌ ${(err as Error).message}`)
    } finally {
      setBusy(false)
      setLastResult(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scanner</h1>
        <p className="text-muted-foreground">Scannez la carte d’un client pour créditer des points.</p>
      </div>

      <InstallPwaBanner />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Caméra</CardTitle>
          <CardDescription>
            {state === 'unsupported' && "Votre navigateur ne supporte pas l'accès caméra — utilisez la saisie manuelle ci-dessous."}
            {state === 'permission-denied' && 'Autorisez l’accès à la caméra dans vos réglages Safari pour scanner les cartes.'}
            {state === 'scanning' && 'Visez le QR code affiché sur le téléphone du client.'}
            {state === 'idle' && 'Initialisation de la caméra…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state !== 'unsupported' && state !== 'permission-denied' && (
            <div id={READER_ELEMENT_ID} className="overflow-hidden rounded-2xl border border-border" />
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Points à créditer</span>
            <Input
              type="number"
              className="w-24"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={1}
            />
          </div>

          {lastResult && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p className="mb-2 truncate text-muted-foreground">Détecté : {lastResult}</p>
              <Button size="sm" disabled={busy} onClick={() => creditPoints(lastResult)}>
                Créditer {points} points
              </Button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (manualSerial) creditPoints(manualSerial)
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Saisie manuelle du numéro de série"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={busy || !manualSerial}>
              Créditer
            </Button>
          </form>

          {feedback && <p className="text-sm">{feedback}</p>}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  )
}
