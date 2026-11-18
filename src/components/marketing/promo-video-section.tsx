'use client'

import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BookDemoButton } from '@/components/marketing/book-demo-button'

// Native <video> controls only mount once playback has actually started —
// before that we show our own centered play button over the poster frame,
// so the section reads as a deliberate player rather than a bare <video>
// tag with a browser-default thumbnail.
export function PromoVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function handlePlay() {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Découvrez Loyalty en 45 secondes</h2>
        <p className="mt-4 text-muted-foreground">
          Du scan en caisse à la campagne ciblée : voyez comment une carte de fidélité devient un canal marketing en
          temps réel.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-foreground shadow-2xl">
          <video
            ref={videoRef}
            src="/videos/loyalty-promo.mp4"
            poster="/videos/loyalty-promo-poster.jpg"
            playsInline
            preload="metadata"
            controls={isPlaying}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="h-full w-full object-cover"
          />

          {!isPlaying && (
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Lire la vidéo de présentation de Loyalty"
              className={cn(
                'group absolute inset-0 flex items-center justify-center',
                'bg-gradient-to-t from-black/50 via-black/5 to-black/20 transition-colors hover:from-black/60'
              )}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
                <Play className="h-8 w-8 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
              </span>
            </button>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <BookDemoButton size="lg" />
        </div>
      </div>
    </section>
  )
}
