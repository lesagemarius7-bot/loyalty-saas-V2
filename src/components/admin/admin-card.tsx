import * as React from 'react'
import { cn } from '@/lib/utils'

// Dark-theme equivalent of components/ui/card.tsx, for use ONLY inside the
// admin backoffice shell (bg-slate-900, see (admin)/admin/(protected)/
// layout.tsx). The shared Card relies on --card/--card-foreground/--border,
// which are calibrated for a white page background — this app never
// activates the .dark class anywhere (no ThemeProvider, no `dark` className
// on <html>), so a plain <Card> inside the dark admin shell renders as a
// bright white box, and text relying on --foreground (near-black) can be
// close to invisible directly on the dark background. AdminCard hardcodes
// slate values instead of theme tokens so it looks right regardless.
export function AdminCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-slate-800 bg-white/[0.03] text-slate-100 shadow-sm', className)}
      {...props}
    />
  )
}

export function AdminCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

export function AdminCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)} {...props} />
}

export function AdminCardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400', className)} {...props} />
}

export function AdminCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function AdminCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

// Applied via className to <Button variant="outline"> whenever it renders
// directly inside the dark admin shell — the shared Button's outline variant
// (border-border, hover:bg-secondary) uses light-mode tokens whose hover
// state is a near-white fill, which combined with inherited light text
// becomes low-contrast on hover. twMerge (via cn()) resolves the conflicts
// in favor of these classes since they're applied last.
export const ADMIN_OUTLINE_BUTTON = 'border-slate-700 text-slate-100 hover:bg-slate-800'
