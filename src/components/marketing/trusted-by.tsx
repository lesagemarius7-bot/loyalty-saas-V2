// Real logo files provided by the user via Drive, where available — falls
// back to a clean text wordmark otherwise (never fabricated logo artwork).
const BRANDS: { name: string; logoUrl: string | null }[] = [
  { name: 'MedEat', logoUrl: '/images/logo-medeat.png' },
  { name: 'Faguo', logoUrl: null },
  { name: 'Maisons du Monde', logoUrl: '/images/logo-maisondumonde.png' },
]

function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-14 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-20" />
  }

  return (
    <span className="text-2xl font-semibold tracking-tight text-muted-foreground transition hover:text-foreground sm:text-3xl">
      {name}
    </span>
  )
}

export function TrustedBy() {
  return (
    <section className="border-t border-border py-20">
      <div className="container">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Ils utilisent Loyalty
        </p>
        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-16 gap-y-10">
          {BRANDS.map((brand) => (
            <BrandLogo key={brand.name} {...brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
