import fs from 'node:fs'
import path from 'node:path'
import http2 from 'node:http2'
import { PKPass } from 'passkit-generator'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

const APPLE_REQUIRED_ENV_VARS = [
  'APPLE_TEAM_IDENTIFIER',
  'APPLE_PASS_TYPE_IDENTIFIER',
  'APPLE_WWDR_CERTIFICATE_BASE64',
  'APPLE_SIGNER_CERTIFICATE_BASE64',
  'APPLE_SIGNER_KEY_BASE64',
] as const

// Route handlers check this before calling generateAppleLoyaltyPass, so they can
// return a clean "not configured" response instead of letting requiredEnv() throw
// mid-generation.
export function isAppleWalletConfigured(): boolean {
  return APPLE_REQUIRED_ENV_VARS.every((name) => Boolean(process.env[name]))
}

function loadCertificates() {
  return {
    wwdr: Buffer.from(requiredEnv('APPLE_WWDR_CERTIFICATE_BASE64'), 'base64'),
    signerCert: Buffer.from(requiredEnv('APPLE_SIGNER_CERTIFICATE_BASE64'), 'base64'),
    signerKey: Buffer.from(requiredEnv('APPLE_SIGNER_KEY_BASE64'), 'base64'),
    signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || undefined,
  }
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

// Static pass artwork shared by every merchant (Apple bakes icon/logo into the
// signed .pkpass at generation time, so per-merchant branding can't swap images at
// scan time — only the background color and text fields can vary per pass).
// Provide real 29x29 / 58x58 icon.png and 160x50 / 320x100 logo.png files here
// for production-quality artwork.
const ASSETS_DIR = path.join(process.cwd(), 'public', 'wallet', 'apple')

// A 1x1 transparent PNG. Apple requires icon.png (at minimum) to exist in every
// .pkpass regardless of certificate configuration — without this fallback,
// generation throws ENOENT on any environment that hasn't been given real
// artwork yet, which is every environment until someone adds
// public/wallet/apple/*.png by hand.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

function loadModelBuffers() {
  const files = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png']
  const buffers: Record<string, Buffer> = {}
  for (const file of files) {
    try {
      buffers[file] = fs.readFileSync(path.join(ASSETS_DIR, file))
    } catch {
      buffers[file] = PLACEHOLDER_PNG
    }
  }
  return buffers
}

// Apple's storeCard strip image (recommended 375x123pt / 750x246px @2x) is the
// only way to put real imagery — including a gradient baked into pixels — on
// an Apple pass: unlike the web/Google previews, PKPass backgroundColor only
// ever accepts a single solid color, there is no native gradient support.
// Best-effort: a broken/unreachable banner URL must not break pass
// generation, so this returns null on any failure and the caller falls back
// to the plain solid-color background.
async function fetchStripImage(bannerImageUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(bannerImageUrl)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('[apple-pass] failed to fetch banner image', err)
    return null
  }
}

export async function generateAppleLoyaltyPass(
  card: LoyaltyCardWithRelations,
  merchant: Merchant
): Promise<Buffer> {
  const buffers = loadModelBuffers()

  if (card.program.banner_image_url) {
    const stripImage = await fetchStripImage(card.program.banner_image_url)
    if (stripImage) {
      buffers['strip.png'] = stripImage
      buffers['strip@2x.png'] = stripImage
    }
  }

  const pass = new PKPass(buffers, loadCertificates(), {
    serialNumber: card.serial_number,
    description: `${merchant.business_name} — carte de fidélité`,
    organizationName: merchant.business_name,
    passTypeIdentifier: requiredEnv('APPLE_PASS_TYPE_IDENTIFIER'),
    teamIdentifier: requiredEnv('APPLE_TEAM_IDENTIFIER'),
    backgroundColor: hexToRgb(merchant.brand_color),
    foregroundColor: hexToRgb(merchant.card_text_color),
    labelColor: hexToRgb(merchant.card_text_color),
    webServiceURL: `${requiredEnv('NEXT_PUBLIC_APP_URL')}/api/wallet/apple`,
    // TODO: replace with a dedicated per-card secret column before going live —
    // reusing the public serial number as the PassKit auth token means anyone who
    // can read a customer's QR code could also hit the device-registration
    // endpoints for that pass.
    authenticationToken: card.serial_number,
  })

  pass.type = 'storeCard'

  pass.primaryFields.push({ key: 'points', label: 'Points', value: card.points_balance })
  pass.secondaryFields.push({ key: 'customer', label: 'Client', value: card.customer.full_name })
  pass.auxiliaryFields.push({
    key: 'reward',
    label: 'Récompense',
    value: `${card.program.reward_threshold} pts → ${card.program.reward_description}`,
  })

  // changeMessage is what makes this show up as a lock-screen notification:
  // when this field's value differs from what the device already has (after a
  // push tells it to re-fetch), iOS shows the templated message instead of
  // silently updating the pass in the background.
  if (card.last_message) {
    pass.backFields.push({
      key: 'lastMessage',
      label: 'Dernier message',
      value: card.last_message,
      changeMessage: '%@',
    })
  }

  // Practical-info backfields — every field is optional at the DB level, so
  // each is only added when the merchant actually filled it in, rather than
  // shipping empty rows on the back of the pass.
  const program = card.program
  if (program.back_address) {
    pass.backFields.push({ key: 'address', label: 'Adresse', value: program.back_address })
  }
  if (program.back_phone) {
    pass.backFields.push({ key: 'phone', label: 'Téléphone', value: program.back_phone })
  }
  if (program.back_hours) {
    pass.backFields.push({ key: 'hours', label: 'Horaires', value: program.back_hours })
  }
  if (program.back_instagram_url) {
    pass.backFields.push({ key: 'instagram', label: 'Instagram', value: program.back_instagram_url })
  }
  if (program.back_google_review_url) {
    pass.backFields.push({ key: 'googleReview', label: 'Laissez-nous un avis ⭐', value: program.back_google_review_url })
  }
  if (program.back_terms) {
    pass.backFields.push({ key: 'terms', label: 'Conditions', value: program.back_terms })
  }

  // Geofencing: iOS surfaces relevantText as a lock-screen notification when
  // the customer is within roughly 50-100m of these coordinates.
  if (program.latitude !== null && program.longitude !== null) {
    pass.setLocations({
      latitude: program.latitude,
      longitude: program.longitude,
      relevantText: 'Vous êtes tout près ! Présentez votre carte pour cumuler des tampons.',
    })
  }

  pass.setBarcodes({
    message: card.serial_number,
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
  })

  return pass.getAsBuffer()
}

// Notifies a single registered device that its pass changed, per Apple's PassKit
// web service spec — Apple then pulls the fresh pass from
// /api/wallet/apple/v1/passes/... rather than receiving the data directly in the
// push. Written to the documented request shape but not yet exercised against a
// live Apple sandbox; verify before relying on it in production.
export async function pushAppleWalletUpdate(pushToken: string): Promise<void> {
  const certs = loadCertificates()
  const client = http2.connect('https://api.push.apple.com:443', {
    cert: certs.signerCert,
    key: certs.signerKey,
    passphrase: certs.signerKeyPassphrase,
  })

  await new Promise<void>((resolve, reject) => {
    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': requiredEnv('APPLE_PASS_TYPE_IDENTIFIER'),
    })

    req.setEncoding('utf8')
    req.write(JSON.stringify({}))
    req.end()

    req.on('response', (headers) => {
      const status = headers[':status']
      if (status === 200) resolve()
      else reject(new Error(`APNs push failed with status ${status}`))
    })
    req.on('error', reject)
  }).finally(() => client.close())
}
