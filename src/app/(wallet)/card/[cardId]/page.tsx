import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { LoyaltyCardVisual } from '@/components/wallet/loyalty-card-visual'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params
  const supabase = createServiceRoleClient()

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*, customer:customers(*), program:loyalty_programs(*)')
    .eq('id', cardId)
    .single<LoyaltyCardWithRelations>()

  if (!card) notFound()

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', card.merchant_id)
    .single<Merchant>()

  if (!merchant) notFound()

  const qrDataUrl = await QRCode.toDataURL(card.serial_number, { margin: 1, width: 240 })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-secondary/40 px-4 py-8">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{card.customer.full_name}</p>
      </div>

      <LoyaltyCardVisual
        businessName={merchant.business_name}
        subtitle={card.program.name}
        logoUrl={merchant.logo_url}
        backgroundColor={merchant.brand_color}
        textColor={merchant.card_text_color}
        pointsBalance={card.points_balance}
        rewardThreshold={card.program.reward_threshold}
        rewardDescription={card.program.reward_description}
        stampIcon={card.program.stamp_icon}
        serialNumber={card.serial_number}
        qrCodeDataUrl={qrDataUrl}
        backgroundStyle={card.program.background_style}
        gradientSecondaryColor={card.program.gradient_secondary_color}
        bannerImageUrl={card.program.banner_image_url}
        backAddress={card.program.back_address}
        backPhone={card.program.back_phone}
        backHours={card.program.back_hours}
        backInstagramUrl={card.program.back_instagram_url}
        backGoogleReviewUrl={card.program.back_google_review_url}
        backTerms={card.program.back_terms}
      />

      <p className="max-w-[340px] text-center text-xs text-muted-foreground">
        Présentez ce code en caisse pour cumuler des points.
      </p>

      <div className="w-full max-w-[340px] space-y-3">
        {/*
          Production note: replace these with Apple's official "Add to Apple
          Wallet" badge asset (required by their brand guidelines) and Google's
          official "Add to Google Wallet" button image — placeholders here since
          this scaffold ships no binary assets.
        */}
        <a
          href={`/api/wallet/apple/generate?cardId=${card.id}`}
          className="flex h-11 w-full items-center justify-center rounded-md bg-black text-sm font-medium text-white hover:opacity-90"
        >
          Ajouter à Apple Wallet
        </a>
        <a
          href={`/api/wallet/google/generate?cardId=${card.id}`}
          className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary"
        >
          Ajouter à Google Wallet
        </a>
      </div>
    </div>
  )
}
