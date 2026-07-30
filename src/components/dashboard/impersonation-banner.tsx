'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ImpersonationBanner({ businessName, merchantId }: { businessName: string; merchantId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleExit() {
    setLoading(true)
    await fetch('/api/admin/impersonate/exit', { method: 'POST' })
    router.push(`/admin/merchants/${merchantId}`)
    router.refresh()
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-md">
      <span>
        ⚠️ Vous naviguez actuellement en tant que <strong>{businessName}</strong> (Mode Support Admin)
      </span>
      <button
        onClick={handleExit}
        disabled={loading}
        className="rounded-md bg-amber-950/10 px-2.5 py-1 font-semibold hover:bg-amber-950/20 disabled:opacity-50"
      >
        {loading ? '…' : '❌ Quitter le mode support'}
      </button>
    </div>
  )
}
