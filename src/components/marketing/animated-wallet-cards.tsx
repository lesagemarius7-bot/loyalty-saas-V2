'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CARD_BLUE_PATH = '/images/carte-fidelite-bleue.png'
const CARD_WHITE_PATH = '/images/carte-fidelite-blanche.png'

type CardColor = 'blue' | 'white'

// Defensive fallback if an image 404s (moved/renamed asset, etc.) — styled to
// the same Indigo/White identity as the real mockups so the section never
// shows a broken-image icon.
function FallbackCard({ color }: { color: CardColor }) {
  const isBlue = color === 'blue'
  return (
    <div
      className={cn(
        'flex aspect-[928/977] w-full flex-col justify-between rounded-[2rem] border p-8 shadow-xl',
        isBlue
          ? 'border-white/10 bg-gradient-to-br from-[#453ee8] to-[#181233] text-white'
          : 'border-border bg-white text-foreground'
      )}
    >
      <div>
        <p className="text-2xl font-bold">Loyalty</p>
        <p className={cn('text-sm', isBlue ? 'text-white/70' : 'text-muted-foreground')}>Carte de fidélité</p>
      </div>
      <div className={cn('h-20 w-20 self-end rounded-xl', isBlue ? 'bg-white/10' : 'bg-secondary')} aria-hidden />
    </div>
  )
}

// Two cards presented side by side, overlapping slightly like cards fanned
// in a wallet — static layout, no continuous animation. The only motion is a
// small hover lift per card, driven purely by CSS (no JS state needed).
export function AnimatedWalletCards() {
  const [errored, setErrored] = useState<Record<CardColor, boolean>>({ blue: false, white: false })

  return (
    <div className="flex items-center justify-center">
      <div className="relative z-10 w-[170px] -rotate-6 drop-shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:rotate-0 sm:w-[240px]">
        {errored.blue ? (
          <FallbackCard color="blue" />
        ) : (
          <Image
            src={CARD_BLUE_PATH}
            alt="Carte de fidélité Loyalty — édition bleue électrique"
            width={928}
            height={977}
            priority
            onError={() => setErrored((prev) => ({ ...prev, blue: true }))}
            className="h-auto w-full"
          />
        )}
      </div>

      <div className="relative z-0 -ml-14 w-[170px] rotate-6 drop-shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:rotate-0 sm:-ml-20 sm:w-[240px]">
        {errored.white ? (
          <FallbackCard color="white" />
        ) : (
          <Image
            src={CARD_WHITE_PATH}
            alt="Carte de fidélité Loyalty — édition blanche épurée"
            width={940}
            height={996}
            onError={() => setErrored((prev) => ({ ...prev, white: true }))}
            className="h-auto w-full"
          />
        )}
      </div>
    </div>
  )
}
