'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import type { ParsedTable } from '@/lib/importers/parse-file'
import type { ImportReport } from '@/lib/importers/import-customers'

const CRM_FIELDS = [
  { key: 'first_name', label: 'Prénom' },
  { key: 'last_name', label: 'Nom' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'last_purchased_category', label: 'Catégorie d’achat' },
  { key: 'current_stamps', label: 'Tampons initiaux' },
] as const

type CrmFieldKey = (typeof CRM_FIELDS)[number]['key']
type Mapping = Partial<Record<CrmFieldKey, string>>

const AUTO_MAP_HINTS: Record<CrmFieldKey, string[]> = {
  first_name: ['prenom', 'prénom', 'first', 'firstname'],
  last_name: ['nom', 'lastname', 'last', 'surname'],
  email: ['email', 'mail', 'e-mail'],
  phone: ['tel', 'phone', 'telephone', 'téléphone', 'mobile'],
  last_purchased_category: ['categ', 'category'],
  current_stamps: ['tampon', 'stamp', 'point'],
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[̀-ͯ]', 'g'), '')
}

function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {}
  for (const field of CRM_FIELDS) {
    const hints = AUTO_MAP_HINTS[field.key]
    const match = headers.find((h) => hints.some((hint) => normalize(h).includes(hint)))
    if (match) mapping[field.key] = match
  }
  return mapping
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'result'
type Tab = 'file' | 'api'

export function ImportCustomersModal({
  apiKey,
  onClose,
  onImported,
}: {
  apiKey: string
  onClose: () => void
  onImported: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('file')
  const [step, setStep] = useState<Step>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [table, setTable] = useState<ParsedTable | null>(null)
  const [mapping, setMapping] = useState<Mapping>({})
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [copied, setCopied] = useState<'key' | 'url' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast, showToast, dismiss } = useToast()

  async function handleFile(file: File) {
    setParsing(true)
    setParseError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/customers/parse-file', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setParseError(data.error ?? 'Impossible de lire ce fichier.')
        return
      }
      setTable(data)
      setMapping(guessMapping(data.headers))
      setStep('mapping')
    } catch {
      setParseError('Impossible de contacter le serveur.')
    } finally {
      setParsing(false)
    }
  }

  function mapRow(row: Record<string, string>) {
    const get = (key: CrmFieldKey) => {
      const header = mapping[key]
      return header ? (row[header] ?? '').trim() : ''
    }
    return {
      first_name: get('first_name'),
      last_name: get('last_name'),
      email: get('email'),
      phone: get('phone'),
      last_purchased_category: get('last_purchased_category'),
      current_stamps: get('current_stamps') ? Number(get('current_stamps')) : undefined,
    }
  }

  function rowIssues(mapped: ReturnType<typeof mapRow>): string | null {
    if (!mapped.email && !mapped.phone) return 'E-mail ou téléphone requis'
    if (mapped.email && !EMAIL_PATTERN.test(mapped.email)) return 'E-mail invalide'
    return null
  }

  async function handleImport() {
    if (!table) return
    setStep('importing')
    setImporting(true)
    try {
      const customers = table.rows.map(mapRow)
      const res = await fetch('/api/customers/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers, overwriteExisting }),
      })
      const data: ImportReport & { error?: unknown } = await res.json()

      if (!res.ok || !data.success) {
        showToast('error', typeof data.error === 'string' ? data.error : 'Échec de l’import.')
        setStep('preview')
        return
      }

      setReport(data)
      setStep('result')
      router.refresh()
      onImported()
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function copyToClipboard(value: string, which: 'key' | 'url') {
    await navigator.clipboard.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/customers/sync` : ''
  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customers": [
      { "first_name": "Marc", "last_name": "Dupont", "email": "marc@example.com", "phone": "+33612345678", "last_purchased_category": "Café" }
    ],
    "overwriteExisting": true
  }'`

  const mappedPreview = table ? table.rows.slice(0, 5).map(mapRow) : []

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-customers-title"
        onClick={onClose}
      >
        <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle id="import-customers-title">📥 Importer une liste de clients</CardTitle>
                <CardDescription className="mt-1">
                  Depuis un fichier, ou en connectant votre logiciel de caisse / comptabilité.
                </CardDescription>
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-1 rounded-lg bg-secondary p-1">
              <button
                type="button"
                onClick={() => setTab('file')}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-all',
                  tab === 'file' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Fichiers (CSV, Excel, PDF)
              </button>
              <button
                type="button"
                onClick={() => setTab('api')}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-all',
                  tab === 'api' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Connexion API / POS
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {tab === 'api' ? (
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Connectez votre logiciel de caisse ou de comptabilité (Stripe, Pennylane, QuickBooks, Square,
                  SumUp…) pour synchroniser automatiquement votre base clients via un webhook.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Clé API marchand</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 font-mono text-xs">{apiKey}</code>
                    <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(apiKey, 'key')}>
                      {copied === 'key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">URL du webhook d’ingestion</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 font-mono text-xs">{webhookUrl}</code>
                    <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl, 'url')}>
                      {copied === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Exemple d’appel (cURL)</label>
                  <pre className="overflow-x-auto rounded-md bg-secondary px-3 py-2 text-xs">{curlExample}</pre>
                </div>

                <p className="text-xs text-muted-foreground">
                  Gardez cette clé secrète — elle permet de créer et modifier vos clients. Chaque appel POST met à
                  jour votre base immédiatement, comme un import de fichier.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {step === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
                      dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'
                    )}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Glissez-déposez un fichier, ou cliquez pour parcourir</p>
                    <p className="text-xs text-muted-foreground">.csv, .xlsx, .xls ou .pdf</p>
                    {parsing && <p className="text-xs text-primary">Lecture du fichier…</p>}
                    {parseError && <p className="text-xs text-destructive">{parseError}</p>}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFile(file)
                      }}
                    />
                  </div>
                )}

                {step === 'mapping' && table && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Associez les colonnes de votre fichier ({table.totalRows} ligne(s) détectée(s)
                      {table.truncated && `, seules les ${table.rows.length} premières seront importées`}) aux champs
                      du CRM.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {CRM_FIELDS.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-xs font-medium">{field.label}</label>
                          <select
                            value={mapping[field.key] ?? ''}
                            onChange={(e) =>
                              setMapping((prev) => ({ ...prev, [field.key]: e.target.value || undefined }))
                            }
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <option value="">— Ignorer —</option>
                            {table.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep('upload')}>
                        Retour
                      </Button>
                      <Button
                        onClick={() => setStep('preview')}
                        disabled={!mapping.email && !mapping.phone}
                      >
                        Continuer
                      </Button>
                    </div>
                    {!mapping.email && !mapping.phone && (
                      <p className="text-xs text-destructive">
                        Associez au moins la colonne E-mail ou Téléphone pour continuer.
                      </p>
                    )}
                  </div>
                )}

                {step === 'preview' && table && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Aperçu des 5 premières lignes sur {table.rows.length} à importer :
                    </p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50 text-left">
                            <th className="px-2 py-1.5">Prénom</th>
                            <th className="px-2 py-1.5">Nom</th>
                            <th className="px-2 py-1.5">E-mail</th>
                            <th className="px-2 py-1.5">Téléphone</th>
                            <th className="px-2 py-1.5">Validation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mappedPreview.map((row, i) => {
                            const issue = rowIssues(row)
                            return (
                              <tr key={i} className="border-b border-border last:border-0">
                                <td className="px-2 py-1.5">{row.first_name || '—'}</td>
                                <td className="px-2 py-1.5">{row.last_name || '—'}</td>
                                <td className="px-2 py-1.5">{row.email || '—'}</td>
                                <td className="px-2 py-1.5">{row.phone || '—'}</td>
                                <td className="px-2 py-1.5">
                                  {issue ? (
                                    <span className="text-destructive">❌ {issue}</span>
                                  ) : (
                                    <span className="text-accent">✅ OK</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Mettre à jour les clients existants (même e-mail ou téléphone)
                    </label>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep('mapping')}>
                        Retour
                      </Button>
                      <Button onClick={handleImport}>Importer {table.rows.length} client(s)</Button>
                    </div>
                  </div>
                )}

                {step === 'importing' && (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Import en cours, ne fermez pas cette fenêtre…</p>
                  </div>
                )}

                {step === 'result' && report && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground">
                        ✅
                      </span>
                      <p className="font-medium">
                        {report.importedCount} client(s) ajouté(s), {report.updatedCount} mis à jour
                      </p>
                      {report.skippedCount > 0 && (
                        <p className="text-sm text-muted-foreground">{report.skippedCount} ligne(s) ignorée(s)</p>
                      )}
                    </div>
                    {report.errors.length > 0 && (
                      <div className="max-h-40 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3">
                        <p className="mb-1 text-xs font-medium text-destructive">Détails :</p>
                        <ul className="space-y-0.5 text-xs text-destructive">
                          {report.errors.slice(0, 50).map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button className="w-full" onClick={onClose}>
                      Terminé
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}
