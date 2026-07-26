import { NextResponse } from 'next/server'

// Apple/Google Wallet passes are cryptographically signed with real
// certificates / a real service-account key — there is no way to fake a pass
// that a device will actually accept. When those credentials aren't present
// (fresh clone, missing .env.local entries), the honest "demo mode" is a clear
// message explaining why nothing was generated, not a fake binary that would
// just fail silently when the merchant tries to add it. Returned as 200 JSON so
// the plain <a target="_blank"> wallet buttons show a readable message instead
// of the browser's generic error page for a non-2xx response.
export function walletNotConfiguredResponse(provider: 'apple' | 'google') {
  const label = provider === 'apple' ? 'Apple Wallet' : 'Google Wallet'
  const envVars =
    provider === 'apple'
      ? 'APPLE_TEAM_IDENTIFIER, APPLE_PASS_TYPE_IDENTIFIER, APPLE_WWDR_CERTIFICATE_BASE64, APPLE_SIGNER_CERTIFICATE_BASE64, APPLE_SIGNER_KEY_BASE64'
      : 'GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, GOOGLE_WALLET_PRIVATE_KEY_BASE64'

  if (process.env.NODE_ENV === 'production') {
    console.error(`[wallet] ${label} requested but not configured in production (missing: ${envVars})`)
  }

  return NextResponse.json(
    {
      demo: true,
      error: `${label} n'est pas configuré sur cet environnement.`,
      message: `Aucune des variables requises (${envVars}) n'est renseignée dans .env.local — voir .env.local.example et certificates/README.md. Aucun pass n'a été généré.`,
    },
    { status: 200 }
  )
}
