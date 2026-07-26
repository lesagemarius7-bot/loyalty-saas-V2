import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// "Get the list of updatable passes for a device" — iOS polls this after a push to
// find out which serial numbers on that device actually changed.
// https://developer.apple.com/documentation/walletpasses/get-the-list-of-updatable-passes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
  const { deviceLibraryIdentifier } = await params
  const updatedSince = new URL(request.url).searchParams.get('passesUpdatedSince')

  const supabase = createServiceRoleClient()

  const { data: registrations } = await supabase
    .from('apple_wallet_registrations')
    .select('card_id, loyalty_cards!inner(serial_number, apple_pass_updated_at)')
    .eq('device_library_identifier', deviceLibraryIdentifier)

  const changed = (registrations ?? []).filter((r) => {
    if (!updatedSince) return true
    const updatedAt = r.loyalty_cards?.apple_pass_updated_at
    return !updatedAt || new Date(updatedAt) > new Date(updatedSince)
  })

  if (changed.length === 0) return new NextResponse(null, { status: 204 })

  return NextResponse.json({
    serialNumbers: changed.map((r) => r.loyalty_cards.serial_number),
    lastUpdated: new Date().toISOString(),
  })
}
