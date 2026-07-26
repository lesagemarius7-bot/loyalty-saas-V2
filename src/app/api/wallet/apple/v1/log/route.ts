import { NextResponse } from 'next/server'

// "Log errors" — iOS posts an array of diagnostic strings here when pass handling
// fails on-device. Apple expects a 200 regardless of content.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { logs?: string[] } | null
  for (const line of body?.logs ?? []) {
    console.warn('[Apple Wallet device log]', line)
  }
  return new NextResponse(null, { status: 200 })
}
