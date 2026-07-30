const GUIDES: { name: string; steps: string[] }[] = [
  {
    name: 'SumUp',
    steps: [
      'Connectez-vous à votre compte développeur sur le portail développeur SumUp (developer.sumup.com).',
      'Créez ou sélectionnez votre application, puis ouvrez la section « Webhooks ».',
      'Ajoutez un nouveau webhook avec l’URL ci-dessus et abonnez-le aux événements de paiement réussi.',
      'Renseignez votre clé API Loyalty (ci-dessus) dans l’en-tête X-Merchant-Api-Key si votre configuration SumUp le permet, sinon transmettez-la dans le corps de la requête via merchant_api_key.',
    ],
  },
  {
    name: 'Square',
    steps: [
      'Ouvrez le Square Developer Dashboard et sélectionnez votre application.',
      'Allez dans l’onglet « Webhooks » et cliquez sur « Add Endpoint ».',
      'Collez l’URL ci-dessus et abonnez-vous à l’événement payment.updated.',
      'Square envoie son propre format de payload — un petit relais (Zapier, Make, ou une fonction serverless) est nécessaire pour transformer le payload Square en payload Loyalty (voir l’exemple JSON ci-dessous) avant de l’envoyer à cette URL.',
    ],
  },
  {
    name: 'Lightspeed',
    steps: [
      'Depuis le portail développeur Lightspeed (Retail ou X-Series selon votre matériel), créez une application et ouvrez la section webhooks/API.',
      'Configurez un webhook déclenché à la complétion d’une vente (sale/order completed).',
      'Comme pour Square, le format de payload Lightspeed diffère du nôtre — un relais léger est nécessaire pour convertir chaque article vendu vers notre tableau items[] (sku, name, quantity, price, category).',
    ],
  },
]

// Best-effort integration guidance, not a certified partnership with any of
// these providers — each platform's own developer docs are the source of
// truth and can change independently of this page, so every guide ends
// with a pointer back to them rather than claiming to be exhaustive.
export function PosGuides() {
  return (
    <div className="space-y-2">
      {GUIDES.map((guide) => (
        <details key={guide.name} className="rounded-md border border-border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">{guide.name}</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            {guide.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Ces étapes peuvent évoluer — consultez toujours la documentation officielle {guide.name} en cas de doute.
          </p>
        </details>
      ))}
    </div>
  )
}
