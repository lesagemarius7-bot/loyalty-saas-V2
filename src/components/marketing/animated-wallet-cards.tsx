'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CARD_BLUE_PATH = '/images/carte-fidelite-bleue.png'
const CARD_WHITE_PATH = '/images/carte-fidelite-blanche.png'

type CardColor = 'blue' | 'white'

const CARDS: { color: CardColor; path: string; width: number; height: number; delay: string }[] = [
  { color: 'blue', path: CARD_BLUE_PATH, width: 928, height: 977, delay: '0s' },
  { color: 'white', path: CARD_WHITE_PATH, width: 940, height: 996, delay: '-3s' },
]

// Defensive fallback if an image 404s (moved/renamed asset, etc.) — styled to
// the same Indigo/White identity as the real mockups so the section never
// shows a broken-image icon.
function FallbackCard({ color }: { color: CardColor }) {
  const isBlue = color === 'blue'
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col justify-between rounded-[2rem] border p-8 shadow-xl',
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

// Apple-Wallet-style stacked card demo for the landing page hero. Two
// independent transform layers per card: an outer wrapper carries the
// continuous idle float (a CSS `animation`, which owns the `transform`
// property outright), an inner wrapper carries the interactive
// rotate/tilt/scale (driven by React state via inline `style`) — animations
// and inline-style transforms fight over the same property if combined on
// one element, so they're split across two.
export function AnimatedWalletCards() {
  const [activeCard, setActiveCard] = useState<CardColor>('blue')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [errored, setErrored] = useState<Record<CardColor, boolean>>({ blue: false, white: false })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({ x: (0.5 - py) * 14, y: (px - 0.5) * 14 })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
  }

  function toggle() {
    setActiveCard((c) => (c === 'blue' ? 'white' : 'blue'))
  }

  return (
    <div className="flex flex-col items-center">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-label="Basculer entre l’édition bleue et l’édition blanche de la carte"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="relative h-[300px] w-[230px] cursor-pointer select-none outline-none sm:h-[420px] sm:w-[330px]"
        style={{ perspective: '1200px' }}
      >
        {CARDS.map(({ color, path, width, height, delay }) => {
          const isFront = color === activeCard
          const innerTransform = isFront
            ? `rotateZ(-4deg) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate(0px, 0px) scale(1)`
            : 'rotateZ(6deg) translate(26px, -20px) scale(0.92)'

          return (
            <div
              key={color}
              className={cn(
                'absolute inset-0 animate-card-float transition-opacity duration-500',
                isFront ? 'z-20 opacity-100' : 'z-10 opacity-85'
              )}
              style={{ animationDelay: delay }}
            >
              <div
                className={cn(
                  'h-full w-full transition-all duration-500 ease-out',
                  isFront ? 'drop-shadow-2xl' : 'drop-shadow-md'
                )}
                style={{ transform: innerTransform, transformStyle: 'preserve-3d' }}
              >
                {errored[color] ? (
                  <FallbackCard color={color} />
                ) : (
                  <Image
                    src={path}
                    alt={
                      color === 'blue'
                        ? 'Carte de fidélité Loyalty — édition bleue électrique'
                        : 'Carte de fidélité Loyalty — édition blanche épurée'
                    }
                    width={width}
                    height={height}
                    priority={color === 'blue'}
                    onError={() => setErrored((prev) => ({ ...prev, [color]: true }))}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setActiveCard('blue')
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            activeCard === 'blue'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          🔵 Édition Bleue (Premium)
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setActiveCard('white')
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            activeCard === 'white'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          ⚪ Édition Blanche (Minimaliste)
        </button>
      </div>
    </div>
  )
}
