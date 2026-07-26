import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4">
      <Link href="/" className="mb-8 text-lg font-semibold">
        Loyalty
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
