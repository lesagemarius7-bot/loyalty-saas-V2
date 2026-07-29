'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Toast } from '@/components/dashboard/toast'
import { useToast } from '@/hooks/use-toast'
import type { TargetedSendProposal } from '@/app/api/ai/ask/route'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Incite les clients à 1 tampon de leur récompense à venir ce week-end.',
  'Relance les clients qu’on n’a pas vus depuis 3 semaines.',
  'Rédige un message sympa pour annoncer nos nouveaux horaires d’été.',
]

export function AskLoyaltyChat({ businessName }: { businessName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [proposal, setProposal] = useState<TargetedSendProposal | null>(null)
  const [sendingProposal, setSendingProposal] = useState(false)
  const { toast, showToast, dismiss } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, proposal])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setProposal(null)
    setThinking(true)

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: messages.slice(-20) }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error ?? 'Une erreur est survenue.'}` }])
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Voici ma proposition ci-dessous.' }])
      if (data.proposal) setProposal(data.proposal)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Impossible de contacter le serveur.' }])
    } finally {
      setThinking(false)
    }
  }

  async function confirmProposal() {
    if (!proposal) return
    setSendingProposal(true)
    try {
      const res = await fetch('/api/notifications/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds: proposal.customerIds,
          targetSummary: proposal.targetSummary,
          title: proposal.title,
          message: proposal.message,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        showToast('error', data.error ?? "Échec de l'envoi.")
        return
      }

      showToast('success', `✅ Envoyé à ${data.recipientCount} client(s).`)
      setProposal(null)
      setMessages((prev) => [...prev, { role: 'assistant', content: `✅ Notification envoyée à ${data.recipientCount} client(s).` }])
    } catch {
      showToast('error', 'Impossible de contacter le serveur.')
    } finally {
      setSendingProposal(false)
    }
  }

  return (
    <>
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bonjour 👋 Je suis le copilote marketing de {businessName}. Essayez par exemple :
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground'
                      : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2 text-sm'
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Ask Loyalty AI réfléchit…
              </div>
            )}

            {proposal && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Proposition
                </div>
                <p className="text-sm text-muted-foreground">Cible : {proposal.targetSummary}</p>
                <p className="text-sm text-muted-foreground">{proposal.customerIds.length} client(s) concerné(s).</p>
                <p className="mt-2 rounded-md bg-card px-3 py-2 text-sm">{proposal.message}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={confirmProposal} disabled={sendingProposal}>
                    {sendingProposal ? 'Envoi…' : '🚀 Valider et Envoyer'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setProposal(null)} disabled={sendingProposal}>
                    Ignorer
                  </Button>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="flex items-center gap-2 border-t border-border p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre demande…"
              disabled={thinking}
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Envoyer">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {toast && <Toast variant={toast.variant} message={toast.message} onDismiss={dismiss} />}
    </>
  )
}
