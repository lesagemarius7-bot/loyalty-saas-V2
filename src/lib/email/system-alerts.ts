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

export interface SystemAlertEmailInput {
  category: string
  message: string
  metadata?: Record<string, unknown>
  logsUrl?: string
}

// Sent by lib/logging/system-log.ts whenever a level='critical' event is
// logged — the only email in this codebase triggered by an internal system
// event rather than a user action, so unlike every other template here it
// has no "safe" business data to show, just whatever the calling code
// passed in (already escaped below).
export function systemAlertEmail({ category, message, metadata, logsUrl }: SystemAlertEmailInput): {
  subject: string
  html: string
  text: string
} {
  const safeMessage = escapeHtml(message)
  const safeCategory = escapeHtml(category)
  const metadataJson = metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : null

  const subject = `🚨 Alerte critique Loyalty [${category}]`

  const html = emailShell(
    `<tr>
      <td style="background-color:#dc2626;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;line-height:1.3;">🚨 Alerte système critique</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 8px;color:#71717a;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">${safeCategory}</p>
        <p style="margin:0 0 24px;color:#18181b;font-size:15px;line-height:1.5;">${safeMessage}</p>
        ${
          metadataJson
            ? `<pre style="margin:0 0 24px;padding:16px;background-color:#f4f4f5;border-radius:8px;font-size:12px;color:#3f3f46;overflow-x:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(metadataJson)}</pre>`
            : ''
        }
        ${
          logsUrl
            ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:9999px;background-color:${BRAND_COLOR};">
                    <a href="${escapeHtml(logsUrl)}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;">
                      Voir les logs
                    </a>
                  </td>
                </tr>
              </table>`
            : ''
        }
      </td>
    </tr>`,
    subject
  )

  const text = `🚨 Alerte système critique [${category}]

${message}${metadataJson ? `\n\n${metadataJson}` : ''}${logsUrl ? `\n\nVoir les logs : ${logsUrl}` : ''}`

  return { subject, html, text }
}
