function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return value.replace(/[&<>"']/g, (char) => entities[char]!)
}

export interface LoyaltyCardReadyEmailInput {
  merchantName: string
  customerName: string
  downloadUrl: string
  brandColor: string
}

// Table-based layout + inline styles throughout — the only way HTML email
// renders consistently across Gmail/Outlook/Apple Mail, none of which reliably
// support <style> blocks or modern CSS.
export function loyaltyCardReadyEmail({
  merchantName,
  customerName,
  downloadUrl,
  brandColor,
}: LoyaltyCardReadyEmailInput): { subject: string; html: string } {
  const safeMerchant = escapeHtml(merchantName)
  const safeCustomer = escapeHtml(customerName)
  const safeUrl = escapeHtml(downloadUrl)

  const subject = `Votre carte de fidélité ${merchantName} est prête !`

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="background-color:${brandColor};padding:32px;text-align:center;">
                <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;opacity:0.85;">${safeMerchant}</p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;line-height:1.3;">Votre carte de fidélité est prête</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;color:#18181b;font-size:15px;line-height:1.5;">Bonjour ${safeCustomer},</p>
                <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.5;">
                  Ajoutez votre carte de fidélité ${safeMerchant} à votre téléphone en un tap — elle se met à jour
                  automatiquement à chaque visite, sans rien à imprimer ni à ressaisir.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="border-radius:9999px;background-color:${brandColor};">
                      <a
                        href="${safeUrl}"
                        style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;"
                      >
                        Ajouter ma carte au Wallet
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5;text-align:center;">
                  Ce lien détecte automatiquement votre téléphone et ouvre Apple Wallet ou Google Wallet.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html }
}
