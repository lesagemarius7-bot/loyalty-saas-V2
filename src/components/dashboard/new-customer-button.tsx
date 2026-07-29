'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'

export function NewCustomerButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setError(null)
  }

  function handleClose() {
    if (submitting) return
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName: lastName || undefined,
          email,
          phone: phone || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        return
      }

      setOpen(false)
      resetForm()
      showToast('success', 'Client créé avec succès')
      router.refresh()
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Nouveau client
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-customer-title"
          onClick={handleClose}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle id="new-customer-title">Nouveau client</CardTitle>
                    <CardDescription>Ajoutez un client et créez sa carte de fidélité.</CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Fermer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Prénom</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Nom</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>

              <div className="flex justify-end gap-3 p-6 pt-0">
                <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Création…' : 'Créer le client'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}
