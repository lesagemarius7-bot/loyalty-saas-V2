'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

export function PlvKitCard() {
  const [generating, setGenerating] = useState(false)
  const { toast, showToast, dismiss } = useToast()

  async function handleDownload() {
    setGenerating(true)
    try {
      const res = await fetch('/api/dashboard/plv-kit')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast('error', data.error ?? 'Échec de la génération du PDF.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'kit-plv-comptoir.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kit PLV comptoir</CardTitle>
          <CardDescription>
            Document A4 prêt à imprimer/plastifier pour votre chevalet de caisse — QR code haute définition vers
            votre carte de fidélité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={handleDownload} disabled={generating}>
            {generating ? 'Génération…' : '🖨️ Télécharger mon Kit PLV Comptoir (PDF)'}
          </Button>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}
