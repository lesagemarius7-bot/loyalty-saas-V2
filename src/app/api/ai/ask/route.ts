import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText, tool, stepCountIs } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getWeatherForCity } from '@/lib/weather/openweather'

const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(20)
    .optional(),
})

// Vercel AI Gateway resolves this "provider/model" string on its own — no
// API key to manage, billed through the Vercel account (OIDC-authenticated
// locally via `vercel env pull`, auto-injected in production).
const AI_MODEL = 'anthropic/claude-sonnet-5'

const proposeTargetedSendSchema = z.object({
  customerIds: z
    .array(z.string().uuid())
    .min(1)
    .describe('IDs des clients ciblés — pris EXCLUSIVEMENT dans la liste de clients fournie dans le contexte, jamais inventés.'),
  targetSummary: z.string().max(200).describe('Résumé court et lisible de la cible, ex: "12 clients habitués du café"'),
  title: z.string().max(60).optional().describe("Titre court de la notification (optionnel)"),
  message: z.string().max(150).describe('Le message envoyé au client — chaleureux, court, jamais plus de 150 caractères'),
})

export type TargetedSendProposal = z.infer<typeof proposeTargetedSendSchema>

function buildSystemPrompt(input: {
  businessName: string
  rewardThreshold: number | null
  city: string | null
  weatherDescription: string | null
  customerContext: unknown
}): string {
  return `Tu es "Ask Loyalty AI", le copilote marketing de ${input.businessName}, un commerce utilisant Loyalty (cartes de fidélité Apple/Google Wallet).

Contexte réel disponible (n'invente RIEN au-delà de ce qui suit) :
- Seuil de récompense du programme de fidélité : ${input.rewardThreshold ?? 'inconnu'} tampons.
- Météo actuelle${input.city ? ` à ${input.city}` : ''} : ${input.weatherDescription ?? 'non disponible'}.
- Liste des clients de ce commerçant (JSON, un objet par client — id, name, stamps, cardStatus, favoriteCategory, lastPurchasedCategory, lastTransactionAt) :
${JSON.stringify(input.customerContext)}

Règles strictes :
1. Tu n'as AUCUN accès aux stocks/inventaire ni à un calendrier d'événements locaux — si on te demande une action basée là-dessus, dis-le clairement plutôt que d'inventer des chiffres.
2. Quand le commerçant te demande de cibler ou relancer des clients, utilise l'outil proposeTargetedSend avec les customerIds RÉELS tirés de la liste ci-dessus. Ne l'envoie jamais toi-même — c'est une proposition qui attend une validation humaine explicite du commerçant.
3. Le message que tu rédiges doit être court (max 150 caractères), chaleureux, en français, adapté au ton d'un commerce de proximité.
4. Si la demande est ambiguë ou que la liste de clients ne permet pas de la satisfaire précisément, pose une question de clarification au lieu de deviner.
5. Réponds toujours en français.`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant } = await supabase.from('merchants').select('id, business_name, city').eq('owner_id', user.id).single()
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const [{ data: program }, { data: customers }] = await Promise.all([
      supabase
        .from('loyalty_programs')
        .select('reward_threshold')
        .eq('merchant_id', merchant.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('customers')
        .select(
          'id, full_name, loyalty_cards(points_balance, status), customer_purchase_habits(favorite_category, last_purchased_category, last_transaction_at)'
        )
        .eq('merchant_id', merchant.id),
    ])

    const weather = merchant.city ? await getWeatherForCity(merchant.city) : null

    const customerContext = (customers ?? []).map((c) => ({
      id: c.id,
      name: c.full_name,
      stamps: c.loyalty_cards?.[0]?.points_balance ?? 0,
      cardStatus: c.loyalty_cards?.[0]?.status ?? 'active',
      favoriteCategory: c.customer_purchase_habits?.favorite_category ?? null,
      lastPurchasedCategory: c.customer_purchase_habits?.last_purchased_category ?? null,
      lastTransactionAt: c.customer_purchase_habits?.last_transaction_at ?? null,
    }))

    const systemPrompt = buildSystemPrompt({
      businessName: merchant.business_name,
      rewardThreshold: program?.reward_threshold ?? null,
      city: merchant.city,
      weatherDescription: weather ? `${Math.round(weather.tempCelsius)}°C, ${weather.description}` : null,
      customerContext,
    })

    const result = await generateText({
      model: AI_MODEL,
      system: systemPrompt,
      messages: [
        ...(parsed.data.history ?? []).map((m) => ({ role: m.role, content: m.content }) as const),
        { role: 'user' as const, content: parsed.data.message },
      ],
      tools: {
        proposeTargetedSend: tool({
          description:
            "Propose l'envoi d'une notification Wallet ciblée à un groupe de clients. Ne fait qu'une proposition — l'envoi réel nécessite une validation humaine explicite, ne l'exécute jamais toi-même.",
          inputSchema: proposeTargetedSendSchema,
        }),
      },
      stopWhen: stepCountIs(2),
    })

    const proposalCall = result.toolCalls.find((c) => c.toolName === 'proposeTargetedSend')

    // Re-validated with the same zod schema rather than trusted from the SDK's
    // (weakly-narrowed) union type — also doubles as a runtime guard against
    // a malformed tool call.
    const parsedProposal = proposalCall ? proposeTargetedSendSchema.safeParse(proposalCall.input) : null

    // Real customer ids the model was given — a hallucinated/stale id here
    // would silently no-op in send-bulk's merchant-scoped query anyway, but
    // filtering it out up front keeps the recipient count shown to the
    // merchant honest.
    const validIds = new Set(customerContext.map((c) => c.id))
    const proposal =
      parsedProposal && parsedProposal.success
        ? { ...parsedProposal.data, customerIds: parsedProposal.data.customerIds.filter((id) => validIds.has(id)) }
        : null

    return NextResponse.json({
      reply: result.text || (proposal ? proposal.targetSummary : ''),
      proposal: proposal && proposal.customerIds.length > 0 ? proposal : null,
    })
  } catch (err) {
    console.error('[ai/ask] failed', err)
    return NextResponse.json(
      { error: "Ask Loyalty AI n'a pas pu répondre.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
