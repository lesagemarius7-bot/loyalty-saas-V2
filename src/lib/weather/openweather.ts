// Same "not configured" pattern as lib/wallet and lib/email — callers check
// this before attempting a lookup, and the smart-engagement engine simply
// skips the weather signal (falls back to habit/inactivity-only rules)
// instead of crashing when no key is set.
export function isWeatherConfigured(): boolean {
  return Boolean(process.env.OPENWEATHER_API_KEY?.trim())
}

export interface WeatherSnapshot {
  tempCelsius: number
  condition: 'clear' | 'cloudy' | 'rain' | 'cold' | 'hot'
  description: string
}

// https://openweathermap.org/current — condition codes 2xx-5xx are all
// precipitation of some kind (thunderstorm/drizzle/rain/snow); we collapse
// them to a single "rain" bucket since the arbitration engine only cares
// about "bad weather that keeps people indoors", not the exact type.
function classifyCondition(weatherId: number, tempCelsius: number): WeatherSnapshot['condition'] {
  if (weatherId < 700) return 'rain'
  if (tempCelsius <= 5) return 'cold'
  if (tempCelsius >= 28) return 'hot'
  if (weatherId >= 801) return 'cloudy'
  return 'clear'
}

// Cached for 30 minutes (Next's fetch cache) — weather doesn't change fast
// enough to justify hitting the API on every cron tick across every merchant.
export async function getWeatherForCity(city: string): Promise<WeatherSnapshot | null> {
  if (!isWeatherConfigured()) return null

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) {
      console.error('[weather] OpenWeatherMap request failed', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const tempCelsius: number | undefined = data?.main?.temp
    const weatherId: number = data?.weather?.[0]?.id ?? 800
    const description: string = data?.weather?.[0]?.description ?? ''

    if (typeof tempCelsius !== 'number') return null

    return { tempCelsius, condition: classifyCondition(weatherId, tempCelsius), description }
  } catch (err) {
    console.error('[weather] request threw', err)
    return null
  }
}
