import type { WeatherSnapshot } from '@/lib/weather/openweather'

export interface ArbitrationInput {
  customerFirstName: string
  weather: WeatherSnapshot | null
  preferredTimeOfDay: 'morning' | 'midday' | 'evening' | null
  currentTimeOfDay: 'morning' | 'midday' | 'evening'
  visitFrequencyDays: number | null
  daysSinceLastVisit: number
  rewardDescription: string
}

export interface ArbitrationDecision {
  shouldSend: boolean
  message: string
  reason: string
}

// Rule-based arbitration — not an LLM call. No LLM API key is configured for
// this, and the product brief explicitly allows "light LLM OR
// cross-referenced rules" as the arbitration mechanism; this is the rules
// half of that "or", built on real signals (transaction-derived habits,
// optional real weather) rather than a fabricated model call. Picks a single
// message per customer, or explicitly declines (shouldSend: false) when
// nothing genuinely matches, rather than falling back to a generic nudge —
// the whole point of this pillar is precision over volume.
export function arbitrate(input: ArbitrationInput): ArbitrationDecision {
  const {
    customerFirstName,
    weather,
    preferredTimeOfDay,
    currentTimeOfDay,
    visitFrequencyDays,
    daysSinceLastVisit,
    rewardDescription,
  } = input

  const isUsualTime = preferredTimeOfDay !== null && preferredTimeOfDay === currentTimeOfDay
  const isOverdue = visitFrequencyDays !== null && visitFrequencyDays > 0 && daysSinceLastVisit >= visitFrequencyDays * 1.5

  if (!isUsualTime || !isOverdue) {
    return { shouldSend: false, message: '', reason: 'no matching signal (needs usual-time AND overdue)' }
  }

  if (weather?.condition === 'rain' || weather?.condition === 'cold') {
    const weatherPhrase = weather.condition === 'rain' ? 'Un temps gris aujourd’hui 🌧️' : 'Un coup de froid aujourd’hui ❄️'
    return {
      shouldSend: true,
      message: `Bonjour ${customerFirstName} ! ${weatherPhrase}… Et si vous veniez vous réchauffer ? ${rewardDescription} vous attend.`,
      reason: `weather=${weather.condition} + usual_time + overdue`,
    }
  }

  return {
    shouldSend: true,
    message: `Bonjour ${customerFirstName} ! On ne vous a pas vu à votre heure habituelle — ${rewardDescription} vous attend toujours.`,
    reason: 'usual_time + overdue (no weather signal)',
  }
}
