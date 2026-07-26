import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            Loyalty
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Tarifs
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Connexion
            </Link>
            <Link href="/signup" className={buttonVariants({ size: 'sm' })}>
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="container text-sm text-muted-foreground">
          © {new Date().getFullYear()} Loyalty. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
