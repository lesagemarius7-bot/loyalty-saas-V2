'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'

// The "Enrôlement comptoir" quick action: generates the enrollment QR client-
// side and triggers a download, so a merchant can print it for the counter
// without a detour through Settings.
export function DownloadQrButton({ enrollmentUrl }: { enrollmentUrl: string }) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const dataUrl = await QRCode.toDataURL(enrollmentUrl, { margin: 2, width: 800 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'qr-code-fidelite.png'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={generating}>
      {generating ? 'Génération…' : '📲 Télécharger mon QR Code'}
    </Button>
  )
}
