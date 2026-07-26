import { Resend } from 'resend'

// Same "not configured" pattern as lib/wallet — routes check this before
// attempting to send, instead of letting the Resend client throw on a missing
// API key mid-request. Logs exactly which variable is missing (name only,
// never the value) so a misconfigured deploy shows up unambiguously in server
// logs instead of a generic "email failed".
export function isEmailConfigured(): boolean {
  const missing: string[] = []
  // .trim() catches a var that's present but blank/whitespace-only (e.g. a
  // stray "RESEND_API_KEY= " left over from copy-pasting the example file),
  // which a plain truthiness check on the raw string would miss.
  if (!process.env.RESEND_API_KEY?.trim()) missing.push('RESEND_API_KEY')
  if (!process.env.EMAIL_FROM?.trim()) missing.push('EMAIL_FROM')

  if (missing.length > 0) {
    console.error(
      `[email] Resend non configuré — variable(s) manquante(s) ou vide(s) dans .env.local : ${missing.join(', ')}. Voir .env.local.example.`
    )
    return false
  }

  return true
}

let client: Resend | null = null

function getClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY)
  }
  return client
}

// Thrown specifically when Resend itself rejected the send (bad recipient,
// unverified domain, test-mode restriction, etc.) — as opposed to a network
// failure or a bug on our end. Routes catch this separately to respond with a
// 400 and the exact message Resend gave, instead of a generic 500.
export class ResendSendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResendSendError'
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const response = await getClient().emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  })

  // Full response (both the success payload and any error) — the single place
  // to look when "the button says it worked but no email arrived" or vice versa.
  console.log('[email] Resend response:', JSON.stringify(response))

  if (response.error) {
    throw new ResendSendError(response.error.message)
  }
}
