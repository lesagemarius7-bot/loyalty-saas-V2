#!/usr/bin/env node
// Generates public/audio/voiceover.mp3 from the narration in src/data/script.ts
// using a real TTS provider, so you don't have to record the voiceover by
// hand. No API key currently configured for this project — set one of the
// env vars below and re-run.
//
// Usage:
//   ELEVENLABS_API_KEY=... node scripts/generate-voiceover.mjs
//   OPENAI_API_KEY=...     node scripts/generate-voiceover.mjs
//
// ElevenLabs is tried first (best-in-class French prosody for this kind of
// ad-read voice) — set ELEVENLABS_VOICE_ID to pick a specific voice,
// otherwise a reasonable multilingual default is used. Falls back to
// OpenAI's TTS API if only OPENAI_API_KEY is set.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/audio')
const outPath = path.join(outDir, 'voiceover.mp3')

// script.ts is TypeScript, not importable directly by plain Node — pull the
// `vo:` string literals out with a regex instead of adding a ts-node/tsx
// dependency just for this one script.
const scriptSrc = readFileSync(path.join(__dirname, '../src/data/script.ts'), 'utf-8')
const lines = [...scriptSrc.matchAll(/vo:\s*'([^']+(?:'[^,]*)?)',/g)].map((m) =>
  m[1].replace(/\\'/g, "'")
)
if (lines.length === 0) {
  console.error('Could not extract any VO lines from src/data/script.ts — check the SCRIPT array format.')
  process.exit(1)
}
const fullText = lines.join(' ')

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
// Chosen voice for the Loyalty VO — override with ELEVENLABS_VOICE_ID if needed.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'ecxPjiGTvAfpGEams6ec'

async function generateWithElevenLabs() {
  console.log(`Generating voiceover with ElevenLabs (voice ${ELEVENLABS_VOICE_ID})…`)
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: fullText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  })
  if (!res.ok) {
    throw new Error(`ElevenLabs API error ${res.status}: ${await res.text()}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function generateWithOpenAI() {
  console.log('Generating voiceover with OpenAI TTS…')
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'onyx',
      input: fullText,
      response_format: 'mp3',
    }),
  })
  if (!res.ok) {
    throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  if (!ELEVENLABS_API_KEY && !OPENAI_API_KEY) {
    console.log(`No TTS API key found in the environment.

Set one of:
  ELEVENLABS_API_KEY   (recommended — best French prosody)
  OPENAI_API_KEY        (fallback)

then re-run: node scripts/generate-voiceover.mjs

In the meantime the timeline renders fine against the silent placeholder
at public/audio/voiceover.wav — or record the narration yourself from
VOICEOVER_SCRIPT.md and drop the MP3 at public/audio/voiceover.mp3.`)
    process.exit(0)
  }

  const audio = ELEVENLABS_API_KEY ? await generateWithElevenLabs() : await generateWithOpenAI()
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, audio)
  console.log(`Wrote ${(audio.length / 1024).toFixed(0)} KB to ${path.relative(process.cwd(), outPath)}`)
  console.log("Don't forget to set VOICEOVER_SRC = 'audio/voiceover.mp3' in src/data/script.ts.")
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
