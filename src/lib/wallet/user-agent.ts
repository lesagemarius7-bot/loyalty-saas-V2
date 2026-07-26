export type WalletPlatform = 'ios' | 'android' | 'other'

// Best-effort User-Agent sniffing so the Smart Link route can skip straight to
// the right wallet with zero intermediate page. Caveat: iPadOS 13+ Safari
// reports itself as "Macintosh" by default (no reliable server-side signal
// without client hints), so some iPads fall into the "other" branch — that
// branch still serves a working .pkpass, so it degrades gracefully rather than
// breaking.
export function detectWalletPlatform(userAgent: string | null): WalletPlatform {
  if (!userAgent) return 'other'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return 'other'
}
