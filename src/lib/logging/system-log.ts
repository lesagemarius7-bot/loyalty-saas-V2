import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database.types'
import { getSuperAdminEmails } from '@/lib/auth/admin-guard'
import { isEmailConfigured, sendEmail } from '@/lib/email/resend'
import { systemAlertEmail } from '@/lib/email/system-alerts'

type Client = SupabaseClient<Database>

const FALLBACK_APP_URL = 'https://loyaltyapp.click'

export interface LogSystemEventInput {
  merchantId?: string | null
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'apns' | 'google_wallet' | 'resend' | 'stripe' | 'cron' | 'webhook'
  message: string
  metadata?: Record<string, unknown>
}

// Real backing store for what (admin)/admin/(protected)/logs/page.tsx used
// to only be able to disclaim ("email sends and raw webhook events aren't
// journalisé de manière persistante"). Every call site below is a genuine
// failure/notable-event path already being console.error'd — this adds a
// persisted, filterable record next to it, not a parallel logging system.
// Best-effort by design: a logging failure must never break the caller's
// actual request (a failed Stripe webhook write shouldn't also fail to log
// itself), so errors here are only console.error'd, never thrown.
export async function logSystemEvent(supabase: Client, input: LogSystemEventInput): Promise<void> {
  const { error } = await supabase.from('system_logs').insert({
    merchant_id: input.merchantId ?? null,
    level: input.level,
    category: input.category,
    message: input.message,
    metadata: (input.metadata ?? {}) as Json,
  })

  if (error) {
    console.error('[system-log] failed to persist log entry', error)
  }

  if (input.level === 'critical') {
    await sendCriticalAlert(input)
  }
}

async function sendCriticalAlert(input: LogSystemEventInput): Promise<void> {
  if (!isEmailConfigured()) return

  try {
    const emails = await getSuperAdminEmails()
    if (emails.length === 0) return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL
    const { subject, html, text } = systemAlertEmail({
      category: input.category,
      message: input.message,
      metadata: input.metadata,
      logsUrl: `${appUrl}/admin/logs`,
    })

    await Promise.all(emails.map((to) => sendEmail({ to, subject, html, text })))
  } catch (err) {
    console.error('[system-log] failed to send critical alert email', err)
  }
}
