'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ToastState {
  variant: 'success' | 'error'
  message: string
}

// Minimal local toast state — no portal/provider needed since every current
// caller renders its own <Toast> right next to where it's shown. If a second
// toast needs to appear simultaneously from a different component on the same
// page, this is the point to promote it to a shared context instead.
export function useToast(durationMs = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), durationMs)
    return () => clearTimeout(timeout)
  }, [toast, durationMs])

  const showToast = useCallback((variant: ToastState['variant'], message: string) => {
    setToast({ variant, message })
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  return { toast, showToast, dismiss }
}
