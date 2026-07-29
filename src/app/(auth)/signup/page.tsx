'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function SignupPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'Inscription impossible')
      setLoading(false)
      return
    }

    // Requires enable_confirmations = false in supabase/config.toml (local dev) or
    // an email-confirmation flow wired up before this runs in production — signUp
    // doesn't return an active session if the account still needs confirming.
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .insert({ owner_id: signUpData.user.id, business_name: businessName, slug: slugify(businessName) })
      .select('id')
      .single()

    if (merchantError || !merchant) {
      setError(merchantError?.message ?? 'Compte créé mais impossible de créer le commerce')
      setLoading(false)
      return
    }

    await supabase.from('loyalty_programs').insert({ merchant_id: merchant.id })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Créer votre compte</CardTitle>
          <CardDescription>14 jours d’essai gratuit, sans carte bancaire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nom de votre commerce"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="vous@commerce.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
