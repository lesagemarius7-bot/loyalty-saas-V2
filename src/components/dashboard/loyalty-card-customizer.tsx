'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { LoyaltyCardVisual } from '@/components/wallet/loyalty-card-visual'
import { WalletNotConfiguredModal } from '@/components/dashboard/wallet-not-configured-modal'
import type { LoyaltyProgram, Merchant } from '@/types'

const THRESHOLD_PRESETS = [5, 8, 10, 12]
const STAMP_ICON_OPTIONS = ['✓', '⭐', '☕', '🍕', '🎁', '🍰']

export function LoyaltyCardCustomizer({
  merchant,
  program,
  isNewProgram = false,
}: {
  merchant: Merchant
  program: LoyaltyProgram
  /** True when `program` is a client-side default, not a real DB row yet. */
  isNewProgram?: boolean
}) {
  const router = useRouter()

  const [businessName, setBusinessName] = useState(merchant.business_name)
  const [subtitle, setSubtitle] = useState(program.name)
  const [logoUrl, setLogoUrl] = useState(merchant.logo_url ?? '')
  const [brandColor, setBrandColor] = useState(merchant.brand_color)
  const [textColor, setTextColor] = useState(merchant.card_text_color)
  const [rewardThreshold, setRewardThreshold] = useState(program.reward_threshold)
  const [rewardDescription, setRewardDescription] = useState(program.reward_description)
  const [stampIcon, setStampIcon] = useState(program.stamp_icon)
  const [previewBalance, setPreviewBalance] = useState(Math.min(3, program.reward_threshold))
  const [walletStyle, setWalletStyle] = useState<'apple' | 'google'>('apple')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [appleQrUrl, setAppleQrUrl] = useState<string | null>(null)
  const [googleQrUrl, setGoogleQrUrl] = useState<string | null>(null)

  const [walletLoading, setWalletLoading] = useState<'apple' | 'google' | null>(null)
  const [walletActionError, setWalletActionError] = useState<string | null>(null)
  const [demoModalProvider, setDemoModalProvider] = useState<'apple' | 'google' | null>(null)

  // The QR codes always point at the plain (non-JSON) URLs — a phone camera
  // navigates there directly and can't interpret a fetch() response, so it needs
  // the real redirect/binary behavior, not the JSON variant the buttons below use.
  const applePreviewUrl = `/api/wallet/apple/preview/${merchant.id}`
  const googlePreviewUrl = `/api/wallet/google/preview/${merchant.id}`

  // The QR targets are stable (keyed only by merchant.id), so they're generated
  // once and never need to change — live edits update the *content* the pass
  // routes serve (via the debounced draft save below), not the QR image itself.
  useEffect(() => {
    const origin = window.location.origin
    QRCode.toDataURL(`${origin}${applePreviewUrl}`, { margin: 1, width: 200 }).then(setAppleQrUrl)
    QRCode.toDataURL(`${origin}${googlePreviewUrl}`, { margin: 1, width: 200 }).then(setGoogleQrUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant.id])

  // Debounced sync of the draft to card_preview_sessions, so the QR code (opened
  // on a different device with no dashboard session) reflects live edits.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch('/api/wallet/preview-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          subtitle,
          logoUrl: logoUrl || null,
          brandColor,
          textColor,
          rewardThreshold,
          rewardDescription,
          stampIcon,
          previewBalance: Math.min(previewBalance, rewardThreshold),
        }),
      }).catch(() => {
        // Best-effort — the preview routes fall back to saved merchant/program
        // data if no draft is available, so a dropped sync isn't fatal.
      })
    }, 500)
    return () => clearTimeout(timeout)
  }, [businessName, subtitle, logoUrl, brandColor, textColor, rewardThreshold, rewardDescription, stampIcon, previewBalance])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const supabase = createClient()
    const programFields = {
      name: subtitle,
      reward_threshold: rewardThreshold,
      reward_description: rewardDescription,
      stamp_icon: stampIcon,
    }

    // A brand-new account (or one whose signup-time program insert failed) has
    // no real loyalty_programs row yet — `program.id` is just a client-side
    // placeholder in that case, so update-by-id would silently match nothing.
    const [merchantResult, programResult] = await Promise.all([
      supabase
        .from('merchants')
        .update({
          business_name: businessName,
          logo_url: logoUrl || null,
          brand_color: brandColor,
          card_text_color: textColor,
        })
        .eq('id', merchant.id),
      isNewProgram
        ? supabase.from('loyalty_programs').insert({ merchant_id: merchant.id, ...programFields })
        : supabase.from('loyalty_programs').update(programFields).eq('id', program.id),
    ])

    setSaving(false)

    if (merchantResult.error || programResult.error) {
      setError(merchantResult.error?.message ?? programResult.error?.message ?? 'Une erreur est survenue')
      return
    }

    setSaved(true)
    router.refresh()
  }

  async function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setUploadError(null)

    const supabase = createClient()
    const extension = file.name.split('.').pop() ?? 'png'
    const path = `${merchant.owner_id}/logo-${Date.now()}.${extension}`

    const { error: uploadErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (uploadErr) {
      setUploadError(uploadErr.message)
      setUploadingLogo(false)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    setUploadingLogo(false)
  }

  // Fetches the pass instead of navigating a plain <a> to it, so we can inspect
  // the response: JSON with demo:true means Apple/Google credentials aren't
  // configured (show the info modal instead of downloading garbage), a real
  // .pkpass/save-link means credentials are present and it's safe to proceed.
  async function handleWalletAction(provider: 'apple' | 'google') {
    setWalletLoading(provider)
    setWalletActionError(null)

    try {
      const url = provider === 'apple' ? applePreviewUrl : `${googlePreviewUrl}?format=json`
      const res = await fetch(url)
      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const data = await res.json()

        if (data.demo) {
          setDemoModalProvider(provider)
        } else if (provider === 'google' && typeof data.saveUrl === 'string') {
          window.open(data.saveUrl, '_blank', 'noopener,noreferrer')
        } else {
          setWalletActionError(data.error ?? 'Une erreur est survenue.')
        }
        return
      }

      if (!res.ok) {
        setWalletActionError('Une erreur est survenue lors de la génération du pass.')
        return
      }

      // Real, signed .pkpass — trigger a download rather than navigating the tab.
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'carte-fidelite.pkpass'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setWalletActionError('Impossible de contacter le serveur.')
    } finally {
      setWalletLoading(null)
    }
  }

  const clampedPreviewBalance = Math.min(previewBalance, rewardThreshold)
  const activeQrUrl = walletStyle === 'apple' ? appleQrUrl : googleQrUrl

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personnaliser la carte</CardTitle>
          <CardDescription>
            Ces réglages définissent le rendu de la carte pour tous vos clients, sur le web comme dans Apple/Google
            Wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom de l’enseigne</label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Sous-titre</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Carte de fidélité"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Logo</label>
              <Input
                type="url"
                placeholder="https://…"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  disabled={uploadingLogo}
                  className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
                />
                {uploadingLogo && <span className="text-xs text-muted-foreground">Import…</span>}
              </div>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Couleur de fond</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-12 shrink-0 rounded-md border border-border"
                  />
                  <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Couleur du texte</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-12 shrink-0 rounded-md border border-border"
                  />
                  <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre de tampons/points requis</label>
              <div className="flex flex-wrap gap-2">
                {THRESHOLD_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRewardThreshold(n)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      rewardThreshold === n
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-secondary'
                    )}
                  >
                    {n}
                  </button>
                ))}
                <Input
                  type="number"
                  min={1}
                  value={rewardThreshold}
                  onChange={(e) => setRewardThreshold(Math.max(1, Number(e.target.value)))}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Icône de tampon</label>
              <div className="flex flex-wrap gap-2">
                {STAMP_ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setStampIcon(icon)}
                    aria-label={`Icône ${icon}`}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border text-lg transition-colors',
                      stampIcon === icon ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Récompense offerte</label>
              <Input
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                placeholder="Ex: 1 café offert"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Aperçu — solde de démo</label>
              <Input
                type="number"
                min={0}
                max={rewardThreshold}
                value={clampedPreviewBalance}
                onChange={(e) => setPreviewBalance(Number(e.target.value))}
                className="w-24"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {saved && <span className="text-sm text-muted-foreground">Enregistré ✅</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-5">
        <div className="flex w-full max-w-[340px] rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setWalletStyle('apple')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
              walletStyle === 'apple' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Apple Wallet
          </button>
          <button
            type="button"
            onClick={() => setWalletStyle('google')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
              walletStyle === 'google' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Google Wallet
          </button>
        </div>

        <LoyaltyCardVisual
          businessName={businessName}
          subtitle={subtitle}
          logoUrl={logoUrl}
          backgroundColor={brandColor}
          textColor={textColor}
          pointsBalance={clampedPreviewBalance}
          rewardThreshold={rewardThreshold}
          rewardDescription={rewardDescription}
          stampIcon={stampIcon}
          serialNumber="APERÇU"
          walletStyle={walletStyle}
        />

        <div className="w-full max-w-[340px] space-y-4 text-center">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Scannez avec l’appareil photo de votre téléphone pour tester l’ajout en direct sur votre Wallet.
            </p>
            {activeQrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeQrUrl}
                alt={`QR code pour tester sur ${walletStyle === 'apple' ? 'Apple' : 'Google'} Wallet`}
                className="mx-auto h-40 w-40 rounded-lg border border-border"
              />
            ) : (
              <div className="mx-auto h-40 w-40 animate-pulse rounded-lg bg-secondary" />
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleWalletAction('apple')}
              disabled={walletLoading === 'apple'}
              className="flex h-11 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {walletLoading === 'apple' ? 'Génération…' : 'Ajouter à Apple Wallet'}
            </button>
            <button
              type="button"
              onClick={() => handleWalletAction('google')}
              disabled={walletLoading === 'google'}
              className="flex h-11 w-full items-center justify-center rounded-md border border-border text-sm font-medium hover:bg-secondary disabled:opacity-60"
            >
              {walletLoading === 'google' ? 'Génération…' : 'Ajouter à Google Wallet'}
            </button>
            {walletActionError && <p className="text-sm text-destructive">{walletActionError}</p>}
          </div>
        </div>
      </div>

      {demoModalProvider && (
        <WalletNotConfiguredModal provider={demoModalProvider} onClose={() => setDemoModalProvider(null)} />
      )}
    </div>
  )
}
