'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const PHONE_PATH = '/images/carte-telephone.png'

// Reveals the phone mockup the moment it scrolls into view (IntersectionObserver,
// fires once — no replay on every scroll pass), fading and sliding in from the
// side on desktop / bottom on mobile. A small hover lift is layered on top as a
// secondary touch; both read from the same Tailwind transform utilities so they
// compose without fighting each other (unlike a CSS `animation` vs. an
// inline-style transform, which do fight over the same property).
export function PhoneShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'w-[170px] transition-all duration-700 ease-out will-change-transform hover:-translate-y-1 hover:scale-[1.02] sm:w-[220px]',
        visible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : 'translate-y-10 opacity-0 sm:translate-x-10 sm:translate-y-0'
      )}
    >
      {errored ? (
        <div className="flex aspect-[736/1358] w-full items-center justify-center rounded-[2.5rem] border-8 border-foreground/80 bg-secondary p-6 text-center text-xs text-muted-foreground">
          Aperçu de l’app Loyalty
        </div>
      ) : (
        <Image
          src={PHONE_PATH}
          alt="La carte de fidélité Loyalty affichée dans l’Apple Wallet d’un smartphone"
          width={736}
          height={1358}
          onError={() => setErrored(true)}
          className="h-auto w-full"
        />
      )}
    </div>
  )
}
