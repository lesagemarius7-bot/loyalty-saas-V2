import { escapeHtml } from '@/lib/email/templates'

const BRAND_COLOR = '#453ee8'

function emailShell(bodyHtml: string, headline: string): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${headline}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            ${bodyHtml}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export interface NewSignupAlertInput {
  businessName: string
  ownerName: string
  email: string
  phone: string | null
  reviewUrl: string
}

// Sent to every merchant row with is_super_admin = true (see who calls this
// in the signup route) — not a single hardcoded address, so it keeps
// working if a second admin account is ever added.
export function newSignupAdminAlertEmail({ businessName, ownerName, email, phone, reviewUrl }: NewSignupAlertInput): {
  subject: string
  html: string
  text: string
} {
  const safeBusiness = escapeHtml(businessName)
  const safeOwner = escapeHtml(ownerName)
  const safeEmail = escapeHtml(email)
  const safePhone = phone ? escapeHtml(phone) : null
  const safeUrl = escapeHtml(reviewUrl)

  const subject = `🚨 Nouvelle demande d'accès commerçant : ${businessName}`

  const html = emailShell(
    `<tr>
      <td style="background-color:${BRAND_COLOR};padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;line-height:1.3;">🚨 Nouvelle demande d'accès</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#18181b;">
          <tr><td style="padding:4px 0;color:#71717a;">Commerce</td><td style="padding:4px 0;text-align:right;font-weight:600;">${safeBusiness}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">Gérant</td><td style="padding:4px 0;text-align:right;">${safeOwner}</td></tr>
          <tr><td style="padding:4px 0;color:#71717a;">E-mail</td><td style="padding:4px 0;text-align:right;">${safeEmail}</td></tr>
          ${safePhone ? `<tr><td style="padding:4px 0;color:#71717a;">Téléphone</td><td style="padding:4px 0;text-align:right;">${safePhone}</td></tr>` : ''}
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
          <tr>
            <td align="center" style="border-radius:9999px;background-color:${BRAND_COLOR};">
              <a href="${safeUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;">
                Examiner la demande
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    subject
  )

  const text = `🚨 Nouvelle demande d'accès

Commerce : ${businessName}
Gérant : ${ownerName}
E-mail : ${email}${phone ? `\nTéléphone : ${phone}` : ''}

Examiner la demande : ${reviewUrl}`

  return { subject, html, text }
}

export interface MerchantApprovedInput {
  businessName: string
  dashboardUrl: string
  pocDurationDays: number
}

export function merchantApprovedEmail({ businessName, dashboardUrl, pocDurationDays }: MerchantApprovedInput): {
  subject: string
  html: string
  text: string
} {
  const safeBusiness = escapeHtml(businessName)
  const safeUrl = escapeHtml(dashboardUrl)

  const subject = "🎉 Votre accès à Loyalty est validé ! Profitez de votre mois d'essai offert"

  const html = emailShell(
    `<tr>
      <td style="background-color:${BRAND_COLOR};padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;line-height:1.3;">🎉 Votre accès est validé</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px;color:#18181b;font-size:15px;line-height:1.5;">Bonjour ${safeBusiness},</p>
        <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.5;">
          Bonne nouvelle : votre demande d'accès à Loyalty a été validée par notre équipe. Vous disposez maintenant
          de ${pocDurationDays} jours d'essai gratuit, sans carte bancaire, pour découvrir la carte de fidélité
          Apple &amp; Google Wallet en conditions réelles.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td align="center" style="border-radius:9999px;background-color:${BRAND_COLOR};">
              <a href="${safeUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;">
                🚀 Accéder à mon tableau de bord
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    subject
  )

  const text = `Bonjour ${businessName},

Bonne nouvelle : votre demande d'accès à Loyalty a été validée par notre équipe. Vous disposez maintenant de ${pocDurationDays} jours d'essai gratuit, sans carte bancaire.

Accéder à mon tableau de bord : ${dashboardUrl}`

  return { subject, html, text }
}
