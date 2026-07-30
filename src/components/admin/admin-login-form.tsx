'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Identifiants incorrects.')
      setLoading(false)
      return
    }

    // Server-verified check (service role, not a client-side RLS-dependent
    // read) — see /api/admin/whoami for why.
    const res = await fetch('/api/admin/whoami')
    const data = await res.json()

    if (!data.isSuperAdmin) {
      await supabase.auth.signOut()
      setError("Accès refusé : ce compte n'a pas les droits Super Admin.")
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="vous@loyalty.app"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
      />
      <PasswordInput
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full bg-[#453ee8] hover:bg-[#706af1]" disabled={loading}>
        {loading ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  )
}
