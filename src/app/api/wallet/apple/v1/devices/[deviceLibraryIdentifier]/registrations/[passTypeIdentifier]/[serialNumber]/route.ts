import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Apple's PassKit web service spec: registers/unregisters a device for push
// updates on a given pass. Called by iOS itself, not by our frontend — the
// endpoint shape (path segments, status codes, auth header) is fixed by Apple and
// documented at
// https://developer.apple.com/documentation/walletpasses/register-a-pass-for-update-notifications
async function authorize(request: Request, serialNumber: string) {
  const supabase = createServiceRoleClient()
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id')
    .eq('serial_number', serialNumber)
    .single()

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^ApplePass\s+/i, '')

  // authenticationToken is currently the serial number itself — see the TODO in
  // lib/wallet/apple-pass.ts. Swap this comparison out if that changes.
  if (!card || token !== serialNumber) return null
  return card
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
  const { deviceLibraryIdentifier, serialNumber } = await params
  const card = await authorize(request, serialNumber)
  if (!card) return new NextResponse(null, { status: 401 })

  const body = (await request.json().catch(() => null)) as { pushToken?: string } | null
  if (!body?.pushToken) return NextResponse.json({ error: 'pushToken required' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('apple_wallet_registrations').upsert(
    { card_id: card.id, device_library_identifier: deviceLibraryIdentifier, push_token: body.pushToken },
    { onConflict: 'card_id,device_library_identifier' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
  const { deviceLibraryIdentifier, serialNumber } = await params
  const card = await authorize(request, serialNumber)
  if (!card) return new NextResponse(null, { status: 401 })

  const supabase = createServiceRoleClient()
  await supabase
    .from('apple_wallet_registrations')
    .delete()
    .eq('card_id', card.id)
    .eq('device_library_identifier', deviceLibraryIdentifier)

  return new NextResponse(null, { status: 200 })
}
