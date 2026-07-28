// Cosmetic emoji hints for common category names — purely presentational.
// The actual category VALUES always come from real pos_transaction_events
// payloads (free text set by whatever POS sends it), so this is a lookup by
// normalized string, not a closed enum: an unrecognized category still
// renders fine with a generic icon, it just won't get a themed one.
const CATEGORY_EMOJI: Record<string, string> = {
  mode: '👕',
  't-shirt': '👕',
  vetements: '👕',
  mobilier: '🪑',
  deco: '🪑',
  meuble: '🪑',
  cafe: '☕',
  resto: '☕',
  restaurant: '☕',
  patisserie: '☕',
  coiffure: '💈',
  beaute: '💅',
}

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g')

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(DIACRITICS_PATTERN, '').trim()
}

export function categoryEmoji(category: string): string {
  const key = normalize(category)
  for (const [needle, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.includes(needle)) return emoji
  }
  return '🏷️'
}
