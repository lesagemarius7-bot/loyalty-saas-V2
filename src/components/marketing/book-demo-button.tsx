import Link from 'next/link'
import { buttonVariants, type ButtonProps } from '@/components/ui/button'

// Falls back to /signup if no scheduling link is configured yet, so the
// button is never dead — set NEXT_PUBLIC_CALENDLY_URL (see
// .env.local.example) once a real Calendly link is available.
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL

export function BookDemoButton({
  variant,
  size,
  className,
  children = 'Réserver une démo',
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  children?: React.ReactNode
}) {
  if (!CALENDLY_URL) {
    return (
      <Link href="/signup" className={buttonVariants({ variant, size, className })}>
        {children}
      </Link>
    )
  }

  return (
    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant, size, className })}>
      {children}
    </a>
  )
}
