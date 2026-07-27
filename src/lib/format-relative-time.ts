// No date library in this project — the activity feed only ever needs
// coarse, French, "il y a X" phrasing, which is simpler to hand-roll than to
// pull in a dependency for.
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / (60 * 1000))

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return new Date(iso).toLocaleDateString('fr-FR')
}
