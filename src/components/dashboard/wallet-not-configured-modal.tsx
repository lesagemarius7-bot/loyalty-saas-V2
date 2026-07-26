'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PROVIDER_INFO = {
  apple: {
    label: 'Apple',
    steps: [
      'Créez un Pass Type ID sur developer.apple.com et exportez son certificat (.p12).',
      'Convertissez les certificats en .pem — voir certificates/README.md à la racine du projet.',
      'Renseignez APPLE_TEAM_IDENTIFIER, APPLE_PASS_TYPE_IDENTIFIER et les 3 variables *_BASE64 dans .env.local.',
    ],
    docUrl: 'https://developer.apple.com/documentation/walletpasses',
    docLabel: 'Documentation Apple Wallet Passes',
  },
  google: {
    label: 'Google',
    steps: [
      'Créez un compte de service dans la Google Wallet Business Console et associez-le à un Issuer ID.',
      'Téléchargez la clé privée JSON du compte de service.',
      'Renseignez GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL et GOOGLE_WALLET_PRIVATE_KEY_BASE64 dans .env.local.',
    ],
    docUrl: 'https://developers.google.com/wallet/generic/web',
    docLabel: 'Documentation Google Wallet',
  },
} as const

export function WalletNotConfiguredModal({
  provider,
  onClose,
}: {
  provider: 'apple' | 'google'
  onClose: () => void
}) {
  const info = PROVIDER_INFO[provider]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-not-configured-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="wallet-not-configured-title" className="text-lg font-semibold">
            Mode test {info.label} Wallet indisponible
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Le mode de test Wallet nécessite la configuration des identifiants Développeur {info.label} dans le
          fichier <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">.env.local</code>.
        </p>

        <div className="mt-4 space-y-2 rounded-md bg-secondary/60 p-3 text-sm">
          <p className="font-medium">Pour activer le mode réel :</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            {info.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <a
          href={info.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-primary underline"
        >
          {info.docLabel} ↗
        </a>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Compris</Button>
        </div>
      </div>
    </div>
  )
}
