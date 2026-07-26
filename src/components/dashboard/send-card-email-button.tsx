'use client'

import { useState } from 'react'
import { Check, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

export function SendCardEmailButton({ customerId, hasEmail }: { customerId: string; hasEmail: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const { toast, showToast, dismiss } = useToast()

  async function handleClick() {
    setStatus('sending')

    try {
      const res = await fetch(`/api/customers/${customerId}/send-card`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok || data.demo) {
        setStatus('error')
        showToast('error', `Échec de l’envoi : ${data.error ?? data.message ?? 'erreur inconnue'}`)
        return
      }

      setStatus('sent')
      showToast('success', 'E-mail envoyé avec succès !')
    } catch {
      setStatus('error')
      showToast('error', 'Échec de l’envoi : impossible de contacter le serveur.')
    }
  }

  if (!hasEmail) {
    return <span className="text-xs text-muted-foreground">Pas d’email</span>
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={status === 'sending'}>
        {status === 'sending' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        {status !== 'sending' &&
          (status === 'sent' ? (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Mail className="mr-1.5 h-3.5 w-3.5" />
          ))}
        {status === 'sending' ? 'Envoi en cours...' : status === 'sent' ? 'Envoyé' : 'Envoyer par e-mail'}
      </Button>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}
