import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { CounterFlatlay } from '../components/CounterFlatlay'
import { KraftBag } from '../components/KraftBag'
import { ReceiptStrip } from '../components/ReceiptStrip'
import { Caption } from '../components/Caption'
import { getCaption } from '../data/script'

// Acte 0, scène 2 — same counter, the next visit. Same bag, but this time
// what lands on the counter is a plain checkout receipt with no loyalty
// line — the blunt, wordless payoff of scene 1's disappearing card.
export function CardLostDisappointmentScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const kickerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const bagIn = spring({ frame: frame - 20, fps, config: { damping: 14, mass: 0.6 } })

  const receiptDrop = spring({ frame: frame - 58, fps, config: { damping: 11, mass: 0.6 } })
  const receiptOpacity = interpolate(frame, [58, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const receiptY = interpolate(receiptDrop, [0, 1], [-70, 0])
  const receiptRotate = interpolate(receiptDrop, [0, 1], [-6, -2])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', opacity: sceneOpacity }}>
      <CounterFlatlay dim>
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 80,
            opacity: kickerOpacity,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 2.5,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
          }}
        >
          📅 Quelques jours plus tard
        </div>

        <div style={{ position: 'absolute', left: 300, top: 420, transform: `scale(${interpolate(bagIn, [0, 1], [0.85, 1])})`, opacity: interpolate(bagIn, [0, 1], [0, 1]) }}>
          <KraftBag width={170} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 700,
            top: 400,
            opacity: receiptOpacity,
            transform: `translateY(${receiptY}px) rotate(${receiptRotate}deg)`,
          }}
        >
          <ReceiptStrip />
        </div>
      </CounterFlatlay>

      <Caption text={getCaption('cardLostDisappointment')} delay={78} />
    </div>
  )
}
