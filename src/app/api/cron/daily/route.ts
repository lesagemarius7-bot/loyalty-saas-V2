import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { pocExpiryReminderEmail } from '@/lib/email/approval-emails'
import { logSystemEvent } from '@/lib/logging/system-log'

export const maxDuration = 60

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

function daysElapsed(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

// Two genuinely new scenarios from the POC lifecycle spec. The spec's third
// scenario ("dormant client anti-churn CRM") is NOT duplicated here — it
// already exists as /api/cron/inactivity-check (scheduled daily at 9h in
// vercel.json), which does exactly that: walks merchants with
// inactivity_reminder_enabled, finds customers past their inactivity
// threshold, and sends the Wallet push + logs the campaign.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()

  try {
    const { data: pocMerchants, error } = await supabase
      .from('merchants')
      .select(
        'id, business_name, owner_id, poc_start_date, poc_duration_days, poc_reminder_7d_sent_at, poc_reminder_3d_sent_at'
      )
      .eq('approval_status', 'approved')
      .eq('billing_status', 'poc_active')
      .eq('is_super_admin', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL
    const emailReady = isEmailConfigured()

    let remindersSent = 0
    let inactivityAlertsSent = 0

    for (const merchant of pocMerchants ?? []) {
      const expiryDate = new Date(merchant.poc_start_date)
      expiryDate.setDate(expiryDate.getDate() + merchant.poc_duration_days)
      const daysUntilExpiry = daysElapsed(now, expiryDate)

      // --- Scenario 1: J-7 / J-3 expiry reminder ------------------------
      const dueMilestone =
        daysUntilExpiry === 7 && !merchant.poc_reminder_7d_sent_at
          ? '7d'
          : daysUntilExpiry === 3 && !merchant.poc_reminder_3d_sent_at
            ? '3d'
            : null

      if (dueMilestone && emailReady) {
        const { data: ownerData } = await supabase.auth.admin.getUserById(merchant.owner_id)
        if (ownerData.user?.email) {
          try {
            const { subject, html, text } = pocExpiryReminderEmail({
              businessName: merchant.business_name,
              daysRemaining: dueMilestone === '7d' ? 7 : 3,
              billingUrl: `${appUrl}/dashboard/billing`,
            })
            await sendEmail({ to: ownerData.user.email, subject, html, text })

            await supabase
              .from('merchants')
              .update(
                dueMilestone === '7d'
                  ? { poc_reminder_7d_sent_at: now.toISOString() }
                  : { poc_reminder_3d_sent_at: now.toISOString() }
              )
              .eq('id', merchant.id)

            remindersSent += 1
          } catch (err) {
            console.error('[cron/daily] failed to send POC expiry reminder', merchant.id, err)
            await logSystemEvent(supabase, {
              merchantId: merchant.id,
              level: 'error',
              category: 'resend',
              message: `Échec d’envoi de la relance POC J-${dueMilestone === '7d' ? 7 : 3}.`,
              metadata: { reason: err instanceof Error ? err.message : String(err) },
            })
          }
        }
      }

      // --- Scenario 2: J+7 zero-activity alert to Super Admin -----------
      const daysSinceStart = daysElapsed(new Date(merchant.poc_start_date), now)
      if (daysSinceStart === 7) {
        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('merchant_id', merchant.id)
          .eq('type', 'earn')
          .gte('created_at', merchant.poc_start_date)

        if ((count ?? 0) === 0) {
          // level: 'critical' — reuses logSystemEvent's existing critical-
          // alert email path instead of a second parallel notification
          // mechanism, satisfying the spec's "envoie une notification au
          // Super Admin" without duplicating that plumbing.
          await logSystemEvent(supabase, {
            merchantId: merchant.id,
            level: 'critical',
            category: 'cron',
            message: `${merchant.business_name} n’a scanné aucun tampon 7 jours après le début de son essai POC.`,
            metadata: { merchantId: merchant.id, pocStartDate: merchant.poc_start_date },
          })
          inactivityAlertsSent += 1
        }
      }
    }

    return NextResponse.json({
      ok: true,
      pocMerchantsChecked: pocMerchants?.length ?? 0,
      remindersSent,
      inactivityAlertsSent,
    })
  } catch (err) {
    console.error('[cron/daily] failed', err)
    await logSystemEvent(supabase, {
      level: 'critical',
      category: 'cron',
      message: `/api/cron/daily a échoué entièrement : ${err instanceof Error ? err.message : String(err)}`,
    })
    return NextResponse.json(
      { error: 'Cron failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
