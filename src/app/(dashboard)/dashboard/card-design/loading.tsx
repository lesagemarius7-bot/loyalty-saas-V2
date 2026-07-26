import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Next.js renders this automatically (via React Suspense) while the async
// page.tsx Server Component is awaiting getCurrentMerchant()/Supabase — no
// manual loading state needed for the initial page load.
export default function CardDesignLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-secondary" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-5 w-48 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-full animate-pulse rounded bg-secondary" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                <div className="h-10 w-full animate-pulse rounded-md bg-secondary" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-5">
          <div className="h-9 w-full max-w-[340px] animate-pulse rounded-xl bg-secondary" />
          <div className="h-[440px] w-full max-w-[340px] animate-pulse rounded-2xl bg-secondary" />
          <div className="h-40 w-40 animate-pulse rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  )
}
