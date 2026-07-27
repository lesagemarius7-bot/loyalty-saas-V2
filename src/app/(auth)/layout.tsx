import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4">
      <Link href="/" className="mb-8">
        <Image
          src="/branding/loyalty-logo-horizontal.png"
          alt="Loyalty"
          width={405}
          height={200}
          priority
          className="h-14 w-auto"
        />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
