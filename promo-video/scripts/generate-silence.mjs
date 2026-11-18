// Generates a silent WAV placeholder at public/audio/voiceover.wav, sized to
// the current timeline (theme.ts TOTAL_DURATION), so <Audio> in PromoVideo.tsx
// always has something to point at and the project renders out of the box
// before you've recorded/generated real narration.
//
// Re-run after changing scene durations in src/theme.ts:
//   node scripts/generate-silence.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Keep this import lazy/manual rather than importing theme.ts directly —
// this script runs under plain Node, not the TS/bundler pipeline, so we
// re-read the two numbers we need with a tiny regex instead of adding a
// ts-node dependency just for this.
const themeSrc = await import('node:fs').then((fs) =>
  fs.readFileSync(path.join(__dirname, '../src/theme.ts'), 'utf-8')
)
const fpsMatch = themeSrc.match(/FPS\s*=\s*(\d+)/)
const durationLines = [...themeSrc.matchAll(/^\s*(\w+):\s*(\d+),/gm)]
const transitionMatch = themeSrc.match(/TRANSITION_FRAMES\s*=\s*(\d+)/)

const fps = fpsMatch ? Number(fpsMatch[1]) : 30
const transitionFrames = transitionMatch ? Number(transitionMatch[1]) : 15
const total = durationLines.reduce((sum, [, , v]) => sum + Number(v), 0) - durationLines.length * transitionFrames + transitionFrames
const seconds = Math.ceil(total / fps) + 1 // +1s safety margin

const sampleRate = 44100
const numSamples = sampleRate * seconds
const dataSize = numSamples * 2 // 16-bit mono

const buffer = Buffer.alloc(44 + dataSize)
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataSize, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16) // fmt chunk size
buffer.writeUInt16LE(1, 20) // PCM
buffer.writeUInt16LE(1, 22) // mono
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * 2, 28) // byte rate
buffer.writeUInt16LE(2, 32) // block align
buffer.writeUInt16LE(16, 34) // bits per sample
buffer.write('data', 36)
buffer.writeUInt32LE(dataSize, 40)
// PCM data left at zero = silence.

const outDir = path.join(__dirname, '../public/audio')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'voiceover.wav')
writeFileSync(outPath, buffer)
console.log(`Wrote ${seconds}s of silence to ${path.relative(process.cwd(), outPath)}`)
