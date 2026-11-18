// Ported from loyalty-saas/src/components/ui/switch.tsx. The video drives
// `checked` from frame progress rather than user interaction, but renders
// pixel-identical to the real dashboard toggle.
import { cn } from '../../lib'

export function Switch({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-secondary',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </span>
  )
}
