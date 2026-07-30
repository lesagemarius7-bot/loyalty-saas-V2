import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { BookDemoButton } from '@/components/marketing/book-demo-button'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/branding/loyalty-logo-horizontal.png"
              alt="Loyalty"
              width={405}
              height={200}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Connexion
            </Link>
            <BookDemoButton variant="outline" size="sm" />
            <Link href="/signup" className={buttonVariants({ size: 'sm' })}>
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="container flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Loyalty. Tous droits réservés.</span>
          <Link href="/admin/login" className="text-xs text-muted-foreground/60 hover:text-muted-foreground">
            Accès Administration
          </Link>
        </div>
      </footer>
    </div>
  )
}
