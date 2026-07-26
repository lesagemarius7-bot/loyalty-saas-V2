'use client'

import { AlertCircle, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastState } from '@/hooks/use-toast'

export function Toast({ variant, message, onDismiss }: ToastState & { onDismiss: () => void }) {
  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 shadow-lg',
        variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-destructive/30 bg-card text-destructive'
      )}
    >
      {variant === 'success' ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Fermer"
        className="ml-1 shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
