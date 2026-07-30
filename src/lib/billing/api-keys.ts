import { randomBytes } from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

// sk_live_ + 32 random alphanumeric chars — readable and copy-pasteable in
// a POS integration's config UI, unlike migration 0013's original 64-char
// hex default. Existing hex keys keep working (this endpoint only changes
// what a *regenerated* key looks like, not a forced migration of every key
// already wired into a real POS integration).
export function generateApiKey(): string {
  const bytes = randomBytes(32)
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return `sk_live_${token}`
}
