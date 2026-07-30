import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Dark-theme equivalent of components/ui/badge.tsx. The shared Badge's
// variants lean on light-mode tokens — 'success' is only a 10%-opacity tint
// (bg-accent/10), which is nearly imperceptible on the dark admin shell;
// 'secondary' is a near-white pill that's legible but looks like a random
// gray chip rather than a deliberate part of the admin's blue/green palette.
// AdminBadge uses saturated color + a matching border (not just a tinted
// fill) so each status reads clearly at a glance.
const adminBadgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      success: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
      warning: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
      destructive: 'border-red-500/40 bg-red-500/20 text-red-300',
      info: 'border-[#706af1]/40 bg-[#706af1]/20 text-[#a5a0f5]',
      secondary: 'border-slate-600 bg-slate-700/60 text-slate-200',
      outline: 'border-slate-600 bg-transparent text-slate-200',
    },
  },
  defaultVariants: { variant: 'secondary' },
})

export interface AdminBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof adminBadgeVariants> {}

export function AdminBadge({ className, variant, ...props }: AdminBadgeProps) {
  return <div className={cn(adminBadgeVariants({ variant }), className)} {...props} />
}
