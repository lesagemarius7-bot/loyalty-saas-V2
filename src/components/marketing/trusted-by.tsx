// Clean text-based placeholders, not fabricated logo artwork — swap in a
// real `logoUrl` per brand once real logo files are provided, and this
// automatically switches from the styled wordmark to the real image.
const BRANDS: { name: string; logoUrl: string | null }[] = [
  { name: 'MedEat', logoUrl: null },
  { name: 'Faguo', logoUrl: null },
  { name: 'Maison du Monde', logoUrl: null },
]

function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-8 w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-10" />
  }

  return (
    <span className="text-xl font-semibold tracking-tight text-muted-foreground transition hover:text-foreground sm:text-2xl">
      {name}
    </span>
  )
}

export function TrustedBy() {
  return (
    <section className="border-t border-border py-16">
      <div className="container">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Ils utilisent Loyalty
        </p>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {BRANDS.map((brand) => (
            <BrandLogo key={brand.name} {...brand} />
          ))}
        </div>
      </div>
    </section>
  )
}
