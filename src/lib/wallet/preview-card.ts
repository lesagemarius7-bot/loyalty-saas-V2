import { z } from 'zod'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

// Shared by the card-design dashboard (writes drafts as the merchant types) and
// the preview wallet routes (read a draft back, or fall back to saved data) — one
// schema keeps both sides honest about the shape stored in
// card_preview_sessions.payload (jsonb, otherwise untyped at the DB level).
export const previewPayloadSchema = z.object({
  businessName: z.string().min(1),
  subtitle: z.string().min(1),
  logoUrl: z.string().optional().nullable(),
  brandColor: z.string().min(1),
  textColor: z.string().min(1),
  rewardThreshold: z.coerce.number().int().min(1),
  rewardDescription: z.string().min(1),
  stampIcon: z.string().min(1),
  previewBalance: z.coerce.number().int().min(0).optional(),
  backgroundStyle: z.enum(['solid', 'gradient']).optional(),
  gradientSecondaryColor: z.string().optional().nullable(),
  bannerImageUrl: z.string().optional().nullable(),
  backAddress: z.string().optional().nullable(),
  backPhone: z.string().optional().nullable(),
  backHours: z.string().optional().nullable(),
  backInstagramUrl: z.string().optional().nullable(),
  backGoogleReviewUrl: z.string().optional().nullable(),
  backTerms: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
})

export type PreviewPayload = z.infer<typeof previewPayloadSchema>

// Builds a fake-but-well-typed card/merchant pair for the "test on your phone"
// wallet routes on /dashboard/card-design — lets a merchant generate a real
// .pkpass / Google Wallet save link from the design form's current values
// without writing a row to loyalty_cards. Reuses the merchant's real id/slug so
// repeated previews update the same Google Wallet object instead of piling up
// new ones.
export function buildPreviewCard(
  realMerchant: Merchant,
  overrides: PreviewPayload
): { card: LoyaltyCardWithRelations; merchant: Merchant } {
  const now = realMerchant.updated_at
  const previewId = `preview-${realMerchant.id}`
  const rewardThreshold = Math.max(overrides.rewardThreshold, 1)
  const pointsBalance = Math.min(overrides.previewBalance ?? Math.min(3, rewardThreshold), rewardThreshold)

  const merchant: Merchant = {
    ...realMerchant,
    business_name: overrides.businessName,
    logo_url: overrides.logoUrl || null,
    brand_color: overrides.brandColor,
    card_text_color: overrides.textColor,
  }

  const card: LoyaltyCardWithRelations = {
    id: previewId,
    merchant_id: realMerchant.id,
    customer_id: previewId,
    program_id: previewId,
    serial_number: `PREVIEW-${realMerchant.slug.toUpperCase()}`,
    points_balance: pointsBalance,
    status: 'active',
    apple_pass_updated_at: null,
    google_object_id: null,
    last_message: null,
    last_message_at: null,
    last_visit_at: null,
    last_inactivity_notification_at: null,
    last_smart_engagement_at: null,
    created_at: now,
    customer: {
      id: previewId,
      merchant_id: realMerchant.id,
      full_name: 'Aperçu',
      email: null,
      phone: null,
      created_at: now,
    },
    program: {
      id: previewId,
      merchant_id: realMerchant.id,
      name: overrides.subtitle || 'Carte de fidélité',
      points_per_euro: 1,
      reward_threshold: rewardThreshold,
      reward_description: overrides.rewardDescription || 'Récompense',
      stamp_icon: overrides.stampIcon || '✓',
      is_active: true,
      inactivity_reminder_enabled: false,
      inactivity_threshold_days: 30,
      inactivity_message: '',
      smart_engagement_enabled: false,
      background_style: overrides.backgroundStyle ?? 'solid',
      gradient_secondary_color: overrides.gradientSecondaryColor || '#0f172a',
      banner_image_url: overrides.bannerImageUrl || null,
      back_address: overrides.backAddress || null,
      back_phone: overrides.backPhone || null,
      back_hours: overrides.backHours || null,
      back_instagram_url: overrides.backInstagramUrl || null,
      back_google_review_url: overrides.backGoogleReviewUrl || null,
      back_terms: overrides.backTerms || '1 tampon par passage en caisse.',
      latitude: overrides.latitude ?? null,
      longitude: overrides.longitude ?? null,
      auto_send_on_payment_enabled: false,
      auto_send_channel: 'email',
      created_at: now,
    },
  }

  return { card, merchant }
}
