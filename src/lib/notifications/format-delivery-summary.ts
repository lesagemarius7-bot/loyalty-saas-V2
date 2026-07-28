export interface PlatformDeliveryStats {
  configured: boolean
  attempted: number
  success: number
  failed: number
  uninstalled: number
}

// Shared toast text for both send flows — real per-platform counts from
// notification_deliveries, not just "attempted".
export function formatDeliverySummary(apple: PlatformDeliveryStats, google: PlatformDeliveryStats): string {
  const parts: string[] = []
  if (apple.configured && apple.attempted > 0) parts.push(`✅ ${apple.success} reçus (Apple)`)
  if (google.configured && google.attempted > 0) parts.push(`✅ ${google.success} reçus (Google)`)

  const uninstalledTotal = apple.uninstalled + google.uninstalled
  if (uninstalledTotal > 0) parts.push(`❌ ${uninstalledTotal} désinstallation(s)`)

  const failedTotal = apple.failed + google.failed
  if (failedTotal > 0) parts.push(`⚠️ ${failedTotal} échec(s)`)

  if (parts.length === 0) return 'Message enregistré — aucun wallet configuré pour l’envoi push.'
  return parts.join(' · ')
}
