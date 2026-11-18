import { Bookmark } from 'lucide-react'
import { LogoMarkTile } from './Logo'

// Ported from the "Aperçu — écran verrouillé" block in loyalty-saas's
// NotificationComposer (notification-composer.tsx) — same bubble styling
// (including the object-contain + padded-background logo fix), plus the
// compose fields above it, for the "send campaign" dashboard scene.
export function NotificationComposerPreview({
  title,
  body,
  businessName = 'Sushi Yama',
}: {
  title: string
  body: string
  businessName?: string
}) {
  return (
    <div className="space-y-4" style={{ width: 380 }}>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Titre du push (optionnel)</label>
        <div className="rounded-md border border-border bg-white px-3 py-2 text-sm" style={{ color: title ? '#0f1729' : '#9ca3af' }}>
          {title || 'Titre…'}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Corps du message</label>
        <div className="rounded-md border border-border bg-white px-3 py-2 text-sm" style={{ minHeight: 56, color: '#0f1729' }}>
          {body}
        </div>
      </div>
      <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <Bookmark className="h-3.5 w-3.5" />
        Sauvegarder comme modèle
      </button>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Aperçu — écran verrouillé (client exemple)</p>
        <div
          className="rounded-2xl border border-border p-3 shadow-lg"
          style={{ background: 'rgba(15,23,41,0.95)', color: '#fff' }}
        >
          <div className="flex items-start gap-2.5">
            <LogoMarkTile size={32} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="truncate text-xs font-semibold uppercase tracking-wide" style={{ opacity: 0.7 }}>
                {businessName}
              </p>
              {title && <p className="truncate text-sm font-semibold">{title}</p>}
              <p className="text-sm leading-snug">{body || 'Votre message apparaîtra ici…'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
