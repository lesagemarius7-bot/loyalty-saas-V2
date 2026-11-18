import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { CounterFlatlay } from '../components/CounterFlatlay'
import { KraftBag } from '../components/KraftBag'
import { CoatPocket } from '../components/CoatPocket'
import { PaperCard } from '../components/PaperCard'
import { Caption } from '../components/Caption'
import { getCaption } from '../data/script'

// Acte 0, scène 1 — minimalist first-person counter shot, no drawn
// characters: a kraft takeout bag and an already-stamped paper card sit on
// the counter, a coat's edge slides into frame, and the card slips out of
// its pocket slit and disappears. The loss itself, shown directly rather
// than narrated.
export function FirstVisitCardReceivedScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sceneIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bagIn = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.6 } })
  const cardIn = spring({ frame: frame - 20, fps, config: { damping: 14, mass: 0.6 } })

  // The coat's edge slides in from the right, lingers, then slides back out.
  const coatProgress = interpolate(frame, [42, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const coatExit = interpolate(frame, [112, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const coatX = interpolate(coatProgress - coatExit, [0, 1], [340, 0])

  // The card slips out of the pocket slit and disappears off-frame.
  const slip = interpolate(frame, [66, 104], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardOpacity = interpolate(frame, [20, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * interpolate(slip, [0.75, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cardX = interpolate(slip, [0, 1], [0, 300])
  const cardY = interpolate(slip, [0, 1], [0, 90])
  const cardRotate = interpolate(slip, [0, 1], [0, 18])
  const cardScale = interpolate(cardIn, [0, 1], [0.8, 1]) * interpolate(slip, [0, 1], [1, 0.7])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', opacity: sceneIn }}>
      <CounterFlatlay>
        <div style={{ position: 'absolute', left: 300, top: 420, transform: `scale(${interpolate(bagIn, [0, 1], [0.8, 1])})`, opacity: interpolate(bagIn, [0, 1], [0, 1]) }}>
          <KraftBag width={170} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 680,
            top: 440,
            opacity: cardOpacity,
            transform: `translate(${cardX}px, ${cardY}px) rotate(${-8 + cardRotate}deg) scale(${cardScale})`,
          }}
        >
          <PaperCard stamps={6} width={250} rotation={0} />
        </div>

        <div
          style={{
            position: 'absolute',
            right: 90,
            top: 240,
            transform: `translateX(${coatX}px)`,
          }}
        >
          <CoatPocket />
        </div>
      </CounterFlatlay>

      <Caption text={getCaption('firstVisitCardReceived')} delay={56} />
    </div>
  )
}
