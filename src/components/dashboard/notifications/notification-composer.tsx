'use client'

import { useRef, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { interpolateTemplate, type InterpolationContext } from '@/lib/notifications/interpolate'
import { NOTIFICATION_VARIABLES, SYSTEM_TEMPLATES } from '@/lib/notifications/variables'
import type { NotificationTemplate } from '@/types'

export interface PreviewCustomerData {
  label: string
  firstName: string
  lastName: string
  favoriteCategory: string | null
  lastPurchasedCategory: string | null
  lastTransactionAt: string | null
  currentStamps: number
}

const FALLBACK_PREVIEW: PreviewCustomerData = {
  label: 'client exemple',
  firstName: 'Camille',
  lastName: 'Dupont',
  favoriteCategory: 'Mode',
  lastPurchasedCategory: 'Mode',
  lastTransactionAt: null,
  currentStamps: 6,
}

function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  tag: string
) {
  if (!el) {
    setValue(value + tag)
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? value.length
  const next = value.slice(0, start) + tag + value.slice(end)
  setValue(next)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + tag.length, start + tag.length)
  })
}

export function NotificationComposer({
  merchantId,
  businessName,
  title,
  onTitleChange,
  body,
  onBodyChange,
  templates,
  previewCustomer,
  maxBodyLength = 150,
}: {
  merchantId: string
  businessName: string
  title: string
  onTitleChange: (v: string) => void
  body: string
  onBodyChange: (v: string) => void
  templates: NotificationTemplate[]
  previewCustomer: PreviewCustomerData | null
  maxBodyLength?: number
}) {
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [activeField, setActiveField] = useState<'title' | 'body'>('body')
  const [customTemplates, setCustomTemplates] = useState(templates)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  function insertVariable(tag: string) {
    if (activeField === 'title') {
      insertAtCursor(titleRef.current, title, onTitleChange, tag)
    } else {
      insertAtCursor(bodyRef.current, body, onBodyChange, tag)
    }
  }

  function applyTemplate(titleTemplate: string, bodyTemplate: string) {
    onTitleChange(titleTemplate)
    onBodyChange(bodyTemplate)
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return
    setSavingTemplate(true)
    setSaveError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({ merchant_id: merchantId, name: templateName.trim(), title_template: title, body_template: body })
      .select()
      .single()

    setSavingTemplate(false)

    if (error || !data) {
      setSaveError(error?.message ?? 'Erreur inconnue')
      return
    }

    setCustomTemplates((prev) => [data, ...prev])
    setSaveModalOpen(false)
    setTemplateName('')
  }

  const previewCtx: InterpolationContext = previewCustomer
    ? {
        firstName: previewCustomer.firstName,
        lastName: previewCustomer.lastName,
        favoriteCategory: previewCustomer.favoriteCategory,
        lastPurchasedCategory: previewCustomer.lastPurchasedCategory,
        lastTransactionAt: previewCustomer.lastTransactionAt,
        currentStamps: previewCustomer.currentStamps,
        businessName,
      }
    : {
        firstName: FALLBACK_PREVIEW.firstName,
        lastName: FALLBACK_PREVIEW.lastName,
        favoriteCategory: FALLBACK_PREVIEW.favoriteCategory,
        lastPurchasedCategory: FALLBACK_PREVIEW.lastPurchasedCategory,
        lastTransactionAt: FALLBACK_PREVIEW.lastTransactionAt,
        currentStamps: FALLBACK_PREVIEW.currentStamps,
        businessName,
      }

  const previewTitle = interpolateTemplate(title, previewCtx)
  const previewBody = interpolateTemplate(body, previewCtx)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Modèle</label>
        <select
          onChange={(e) => {
            const value = e.target.value
            if (!value) return
            const system = SYSTEM_TEMPLATES.find((t) => t.id === value)
            if (system) {
              applyTemplate(system.titleTemplate, system.bodyTemplate)
              return
            }
            const custom = customTemplates.find((t) => t.id === value)
            if (custom) applyTemplate(custom.title_template, custom.body_template)
            e.target.value = ''
          }}
          defaultValue=""
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="" disabled>
            Choisir un modèle…
          </option>
          <optgroup label="Modèles intégrés">
            {SYSTEM_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
          {customTemplates.length > 0 && (
            <optgroup label="Mes modèles">
              {customTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Titre du push (optionnel)</label>
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onFocus={() => setActiveField('title')}
          placeholder="Ex : Offre exclusive sur notre collection T-Shirts !"
          maxLength={60}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Corps du message</label>
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => onBodyChange(e.target.value.slice(0, maxBodyLength))}
          onFocus={() => setActiveField('body')}
          placeholder="Bonjour {{first_name}}, profitez de -15% sur la nouvelle collection !"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="text-right text-xs text-muted-foreground">
          {body.length}/{maxBodyLength}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Insérer une variable dans {activeField === 'title' ? 'le titre' : 'le message'} :
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOTIFICATION_VARIABLES.map((v) => (
            <button
              key={v.tag}
              type="button"
              onClick={() => insertVariable(v.tag)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSaveModalOpen((v) => !v)}
        disabled={!title.trim() && !body.trim()}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Sauvegarder comme modèle
      </button>

      {saveModalOpen && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 p-3">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nom du modèle"
            className="flex-1"
          />
          <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim() || savingTemplate}>
            {savingTemplate ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      )}
      {saveError && <p className="text-xs text-destructive">{saveError}</p>}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Aperçu — écran verrouillé ({previewCustomer ? previewCustomer.label : 'client exemple'})
        </p>
        <div className="rounded-2xl border border-border bg-foreground/95 p-3 text-background shadow-lg">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              {businessName.slice(0, 2).toUpperCase()}
            </div>
            <div className={cn('min-w-0 flex-1', !previewTitle && !previewBody && 'opacity-50')}>
              <p className="truncate text-xs font-semibold uppercase tracking-wide opacity-70">{businessName}</p>
              {previewTitle && <p className="truncate text-sm font-semibold">{previewTitle}</p>}
              <p className="text-sm leading-snug">{previewBody || 'Votre message apparaîtra ici…'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
