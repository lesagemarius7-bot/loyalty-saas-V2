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

function loyaltyObjectId(card: LoyaltyCardWithRelations) {
  return `${issuerId()}.card_${card.id}`
}

// Creates the class/object if missing, otherwise updates them with the current
// points balance. Call this before issuing a save link, and again after
// /api/points/add so an already-saved pass picks up the new balance.
export async function upsertGoogleLoyaltyObject(card: LoyaltyCardWithRelations, merchant: Merchant) {
  const client = await authClient().getClient()

  const classPayload = {
    id: loyaltyClassId(merchant),
    issuerName: merchant.business_name,
    programName: card.program.name,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: merchant.brand_color,
  }

  await upsertResource(client, `${API_BASE}/loyaltyClass`, loyaltyClassId(merchant), classPayload)

  const objectPayload = {
    id: loyaltyObjectId(card),
    classId: loyaltyClassId(merchant),
    state: 'ACTIVE',
    accountName: card.customer.full_name,
    loyaltyPoints: { label: 'Points', balance: { int: card.points_balance } },
    barcode: { type: 'QR_CODE', value: card.serial_number },
  }

  await upsertResource(client, `${API_BASE}/loyaltyObject`, loyaltyObjectId(card), objectPayload)
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
    payload: { loyaltyObjects: [{ id: loyaltyObjectId(card) }] },
  }

  const base64url = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${base64url(header)}.${base64url(payload)}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey())
  const jwt = `${unsigned}.${signature.toString('base64url')}`

  return `https://pay.google.com/gp/v/save/${jwt}`
}
