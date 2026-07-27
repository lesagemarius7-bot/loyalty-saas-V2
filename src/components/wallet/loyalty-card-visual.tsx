'use client'

import { useState } from 'react'

const MAX_VISIBLE_DOTS = 20

export interface LoyaltyCardVisualProps {
  businessName: string
  subtitle: string
  logoUrl?: string | null
  backgroundColor: string
  textColor: string
  pointsBalance: number
  rewardThreshold: number
  rewardDescription: string
  stampIcon: string
  serialNumber: string
  /**
   * A real scannable QR code (data URL). Omitted on the dashboard design
   * preview when no destination URL is ready yet — a decorative placeholder is
   * rendered instead so the preview still communicates "this is where the scan
   * code goes" without implying it's scannable.
   */
  qrCodeDataUrl?: string | null
  /** Which wallet's visual conventions to mimic. Defaults to the Google style. */
  walletStyle?: 'apple' | 'google'
  /** 'gradient' blends backgroundColor → gradientSecondaryColor diagonally. Neither Apple nor Google Wallet supports this natively on the real pass — see apple-pass.ts/google-wallet.ts — so this is accurate for the web/app preview only. */
  backgroundStyle?: 'solid' | 'gradient'
  gradientSecondaryColor?: string | null
  /** Header banner (strip image), ~375x123. */
  bannerImageUrl?: string | null
  backAddress?: string | null
  backPhone?: string | null
  backHours?: string | null
  backInstagramUrl?: string | null
  backGoogleReviewUrl?: string | null
  backTerms?: string | null
}

function handleLogoError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

// Shared between the merchant's live design preview (dashboard/card-design) and
// the real customer-facing card page (/card/[cardId]) — keeping them on one
// component is what makes the dashboard preview an honest preview instead of a
// mockup that can drift from what customers actually see.
export function LoyaltyCardVisual({
  businessName,
  subtitle,
  logoUrl,
  backgroundColor,
  textColor,
  pointsBalance,
  rewardThreshold,
  rewardDescription,
  stampIcon,
  serialNumber,
  qrCodeDataUrl,
  walletStyle = 'google',
  backgroundStyle = 'solid',
  gradientSecondaryColor,
  bannerImageUrl,
  backAddress,
  backPhone,
  backHours,
  backInstagramUrl,
  backGoogleReviewUrl,
  backTerms,
}: LoyaltyCardVisualProps) {
  const [showBack, setShowBack] = useState(false)

  const safeThreshold = Math.max(rewardThreshold, 1)
  const showDotGrid = safeThreshold <= MAX_VISIBLE_DOTS
  const progressRatio = Math.min(pointsBalance / safeThreshold, 1)
  const initials = businessName.slice(0, 2).toUpperCase() || '—'

  const cardBackground =
    backgroundStyle === 'gradient'
      ? `linear-gradient(135deg, ${backgroundColor}, ${gradientSecondaryColor || '#0f172a'})`
      : backgroundColor

  const backRows = [
    { label: 'Adresse', value: backAddress },
    { label: 'Téléphone', value: backPhone },
    { label: 'Horaires', value: backHours },
    { label: 'Instagram', value: backInstagramUrl },
    { label: 'Avis Google ⭐', value: backGoogleReviewUrl },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))
  const hasBackContent = backRows.length > 0 || Boolean(backTerms)

  const bannerBlock = bannerImageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={bannerImageUrl} alt="" className="h-[100px] w-full object-cover" />
  ) : null

  const progressSection = (
    <div className="my-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider opacity-80">Points cumulés</span>
        <span className="text-sm font-bold">
          {pointsBalance} / {rewardThreshold}
        </span>
      </div>

      {showDotGrid ? (
        <div className="grid grid-cols-5 gap-2.5 rounded-xl bg-black/10 p-3 backdrop-blur-sm">
          {Array.from({ length: safeThreshold }).map((_, index) => {
            const isFilled = index < pointsBalance
            const isRewardSlot = index === safeThreshold - 1
            return (
              <div
                key={index}
                className={`flex aspect-square items-center justify-center rounded-full transition-all ${
                  isFilled ? 'scale-105 bg-white text-slate-900 shadow-md' : 'border border-white/20 bg-white/10'
                }`}
              >
                {isFilled ? (
                  <span className="text-sm font-bold">{stampIcon}</span>
                ) : isRewardSlot ? (
                  <span className="text-xs">🎁</span>
                ) : (
                  <span className="text-[10px] opacity-40">{index + 1}</span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-black/10 p-3 backdrop-blur-sm">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white" style={{ width: `${progressRatio * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  )

  const qrBlock = (
    <div className="flex flex-col items-center justify-center space-y-1 bg-white p-3">
      {qrCodeDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCodeDataUrl} alt="QR code de la carte" className="h-24 w-24" />
      ) : (
        <div className="grid h-24 w-24 grid-cols-8 gap-0.5 rounded bg-slate-900 p-1" aria-hidden>
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={(i * 7) % 3 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-transparent'} />
          ))}
        </div>
      )}
      <p className="font-mono text-[10px] tracking-widest text-slate-500">{serialNumber}</p>
    </div>
  )

  const toggleButton = hasBackContent ? (
    <button
      type="button"
      onClick={() => setShowBack((v) => !v)}
      className="mt-3 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
    >
      {showBack ? 'Voir le recto' : 'Voir le verso'}
    </button>
  ) : null

  if (showBack && hasBackContent) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="w-full max-w-[340px] overflow-hidden rounded-xl border border-white/10 p-5 shadow-2xl"
          style={{ background: cardBackground, color: textColor }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {businessName || 'Mon commerce'}
          </p>
          <div className="mt-4 space-y-3">
            {backRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-sm"
              >
                <span className="shrink-0 opacity-70">{row.label}</span>
                <span className="max-w-[70%] break-words text-right font-medium">{row.value}</span>
              </div>
            ))}
            {backTerms && <p className="pt-1 text-xs leading-relaxed opacity-70">{backTerms}</p>}
          </div>
        </div>
        {toggleButton}
      </div>
    )
  }

  if (walletStyle === 'apple') {
    return (
      <div className="flex flex-col items-center">
        <div
          className="w-full max-w-[340px] overflow-hidden rounded-xl border border-white/10 shadow-2xl"
          style={{ background: cardBackground, color: textColor }}
        >
          {bannerBlock}
          <div className="p-5 pb-0">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="h-8 w-8 rounded-md bg-white/10 object-contain p-1"
                  onError={handleLogoError}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-xs font-bold">
                  {initials}
                </div>
              )}
              <span className="truncate text-xs font-semibold uppercase tracking-wider opacity-80">
                {businessName || 'Mon commerce'}
              </span>
            </div>

            <p className="mt-4 text-[11px] uppercase tracking-wider opacity-70">{subtitle || 'Carte de fidélité'}</p>
            <p className="text-4xl font-bold leading-tight">
              {pointsBalance} <span className="text-base font-medium opacity-70">/ {rewardThreshold} pts</span>
            </p>

            {progressSection}

            <div className="flex items-center justify-between border-t border-white/10 py-3 text-xs">
              <span className="uppercase tracking-wider opacity-70">Récompense</span>
              <span className="font-semibold">{rewardDescription || 'Récompense'}</span>
            </div>
          </div>

          {qrBlock}
        </div>
        {toggleButton}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: cardBackground, color: textColor }}
      >
        {bannerBlock}
        <div className="p-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={businessName}
                className="h-10 w-10 rounded-full bg-white/10 object-contain p-1"
                onError={handleLogoError}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
                {subtitle || 'Carte de fidélité'}
              </p>
              <h3 className="truncate text-lg font-bold leading-tight">{businessName || 'Mon commerce'}</h3>
            </div>
          </div>

          {progressSection}

          <div className="mb-4 rounded-xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-wider opacity-75">Objectif</p>
            <p className="mt-0.5 text-sm font-bold">{rewardDescription || 'Récompense'}</p>
          </div>
        </div>

        {qrBlock}
      </div>
      {toggleButton}
    </div>
  )
}
