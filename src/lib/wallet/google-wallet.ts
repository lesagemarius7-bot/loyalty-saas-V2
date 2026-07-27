import crypto from 'node:crypto'
import { GoogleAuth } from 'google-auth-library'
import type { LoyaltyCardWithRelations, Merchant } from '@/types'

const WALLET_OBJECT_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer'
const API_BASE = 'https://walletobjects.googleapis.com/walletobjects/v1'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

const GOOGLE_REQUIRED_ENV_VARS = [
  'GOOGLE_WALLET_ISSUER_ID',
  'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_WALLET_PRIVATE_KEY_BASE64',
] as const

// Route handlers check this before calling into the Wallet Objects API, so they
// can return a clean "not configured" response instead of letting requiredEnv()
// throw mid-request.
export function isGoogleWalletConfigured(): boolean {
  return GOOGLE_REQUIRED_ENV_VARS.every((name) => Boolean(process.env[name]))
}

function issuerId() {
  return requiredEnv('GOOGLE_WALLET_ISSUER_ID')
}

function serviceAccountEmail() {
  return requiredEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL')
}

function privateKey() {
  return Buffer.from(requiredEnv('GOOGLE_WALLET_PRIVATE_KEY_BASE64'), 'base64').toString('utf-8')
}

function authClient() {
  return new GoogleAuth({
    credentials: { client_email: serviceAccountEmail(), private_key: privateKey() },
    scopes: [WALLET_OBJECT_SCOPE],
  })
}

// One Loyalty Class per merchant (tenant), reused across all of that merchant's
// cards — mirrors how a single Apple Pass Type ID is shared and differentiated by
// serial number.
function loyaltyClassId(merchant: Merchant) {
  return `${issuerId()}.merchant_${merchant.id}`
}

function loyaltyObjectId(cardId: string) {
  return `${issuerId()}.card_${cardId}`
}

// Creates the class/object if missing, otherwise updates them with the current
// points balance. Call this before issuing a save link, and again after
// /api/points/add so an already-saved pass picks up the new balance.
export async function upsertGoogleLoyaltyObject(card: LoyaltyCardWithRelations, merchant: Merchant) {
  const client = await authClient().getClient()
  const program = card.program

  const infoRows: { columns: { label: string; value: string }[] }[] = []
  if (program.back_address) infoRows.push({ columns: [{ label: 'Adresse', value: program.back_address }] })
  if (program.back_phone) infoRows.push({ columns: [{ label: 'Téléphone', value: program.back_phone }] })
  if (program.back_hours) infoRows.push({ columns: [{ label: 'Horaires', value: program.back_hours }] })
  if (program.back_terms) infoRows.push({ columns: [{ label: 'Conditions', value: program.back_terms }] })

  const linkUris: { uri: string; description: string; id: string }[] = []
  if (program.back_instagram_url) {
    linkUris.push({ uri: program.back_instagram_url, description: 'Instagram', id: 'instagram' })
  }
  if (program.back_google_review_url) {
    linkUris.push({ uri: program.back_google_review_url, description: 'Laissez-nous un avis ⭐', id: 'googleReview' })
  }

  const classPayload = {
    id: loyaltyClassId(merchant),
    issuerName: merchant.business_name,
    programName: card.program.name,
    reviewStatus: 'UNDER_REVIEW',
    // hexBackgroundColor is solid-only — like Apple's storeCard, the Wallet
    // Objects API has no native gradient support, so the "gradient" theme
    // only shows as real pixels via heroImage below.
    hexBackgroundColor: merchant.brand_color,
    ...(program.banner_image_url && {
      heroImage: { sourceUri: { uri: program.banner_image_url } },
    }),
    ...(infoRows.length > 0 && { infoModuleData: { labelValueRows: infoRows } }),
    ...(linkUris.length > 0 && { linksModuleData: { uris: linkUris } }),
    // Triggers the lock-screen proximity notification (roughly 50-100m
    // radius) when both coordinates are set.
    ...(program.latitude !== null &&
      program.longitude !== null && {
        locations: [{ latitude: program.latitude, longitude: program.longitude }],
      }),
  }

  await upsertResource(client, `${API_BASE}/loyaltyClass`, loyaltyClassId(merchant), classPayload)

  const objectPayload = {
    id: loyaltyObjectId(card.id),
    classId: loyaltyClassId(merchant),
    state: 'ACTIVE',
    accountName: card.customer.full_name,
    loyaltyPoints: { label: 'Points', balance: { int: card.points_balance } },
    barcode: { type: 'QR_CODE', value: card.serial_number },
  }

  await upsertResource(client, `${API_BASE}/loyaltyObject`, loyaltyObjectId(card.id), objectPayload)
}

// PUT-if-exists-else-POST — the Wallet Objects API has no single upsert verb.
async function upsertResource(
  client: Awaited<ReturnType<GoogleAuth['getClient']>>,
  collectionUrl: string,
  resourceId: string,
  payload: Record<string, unknown>
) {
  const putResponse = await client.request({
    url: `${collectionUrl}/${resourceId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    validateStatus: () => true,
  })

  if (putResponse.status === 404) {
    await client.request({
      url: collectionUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } else if (putResponse.status >= 400) {
    throw new Error(`Google Wallet API error ${putResponse.status}: ${JSON.stringify(putResponse.data)}`)
  }
}

// Pushes a message onto an already-saved Google Wallet loyalty object — Google
// surfaces it as a notification on the customer's device and as a message on
// the card itself. The Apple equivalent needs a field changeMessage trick
// (see generateAppleLoyaltyPass); Google has a dedicated endpoint for this.
export async function sendGoogleWalletMessage(cardId: string, header: string, body: string): Promise<void> {
  const client = await authClient().getClient()

  const response = await client.request({
    url: `${API_BASE}/loyaltyObject/${loyaltyObjectId(cardId)}/addMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { header, body, messageType: 'TEXT' } }),
    validateStatus: () => true,
  })

  if (response.status >= 400) {
    throw new Error(`Google Wallet addMessage error ${response.status}: ${JSON.stringify(response.data)}`)
  }
}

// Builds the "Add to Google Wallet" save link: a JWT self-signed with the service
// account key (never sent to Google's auth server), referencing the object created
// above. See https://developers.google.com/wallet/generic/web
export function createGoogleWalletSaveLink(card: LoyaltyCardWithRelations): string {
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccountEmail(),
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: { loyaltyObjects: [{ id: loyaltyObjectId(card.id) }] },
  }

  const base64url = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${base64url(header)}.${base64url(payload)}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey())
  const jwt = `${unsigned}.${signature.toString('base64url')}`

  return `https://pay.google.com/gp/v/save/${jwt}`
}
