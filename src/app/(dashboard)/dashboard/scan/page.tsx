'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InstallPwaBanner } from '@/components/dashboard/scan/install-pwa-banner'

type ScanState = 'idle' | 'scanning' | 'unsupported' | 'error'

// Uses the browser's native BarcodeDetector API instead of a JS decoding library —
// zero extra bundle weight, and support is now broad enough (Chrome/Edge/Android,
// Safari 17+) for a staff-facing tool where you control the devices in use. Falls
// back to a manual serial-number entry field when it's unavailable.
export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ScanState>('idle')
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [manualSerial, setManualSerial] = useState('')
  const [points, setPoints] = useState(10)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setState('unsupported')
      return
    }

    let stream: MediaStream | null = null
    let frameId: number

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setState('scanning')

        // @ts-expect-error — BarcodeDetector isn't in TS's lib.dom.d.ts yet.
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })

        const tick = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes[0]?.rawValue) {
                setLastResult(codes[0].rawValue)
              }
            } catch {
              // transient decode failure — just try again next frame
            }
          }
          frameId = requestAnimationFrame(tick)
        }
        frameId = requestAnimationFrame(tick)
      } catch {
        setState('error')
      }
    }

    start()

    return () => {
      cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((track) => track.stop())
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
            {state === 'unsupported' && "Votre navigateur ne supporte pas le scan natif — utilisez la saisie manuelle ci-dessous."}
            {state === 'error' && 'Accès caméra refusé ou indisponible.'}
            {state === 'scanning' && 'Visez le QR code affiché sur le téléphone du client.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state !== 'unsupported' && (
            <video ref={videoRef} className="aspect-video w-full rounded-md bg-black" muted playsInline />
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
