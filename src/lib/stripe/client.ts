import Stripe from 'stripe'

let instance: Stripe | undefined

function getStripe(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return instance
}

// Lazy singleton behind a Proxy. Constructing Stripe eagerly at module load
// crashed `next build`'s page-data-collection step for every route that
// imports this file whenever STRIPE_SECRET_KEY was unset locally (e.g. the
// dunning/export-csv admin routes), even though those routes have nothing to
// do with Stripe failing. Deferring construction to first real property
// access — actual request time — fixes that, while every existing
// `stripe.foo.bar()` call site keeps working unchanged.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})
