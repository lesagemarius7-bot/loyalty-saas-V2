import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCustomerFile } from '@/lib/importers/parse-file'

// Backs the import modal's drag-and-drop step — parses CSV/Excel/PDF
// server-side (pdf-parse and xlsx aren't meaningfully usable in the browser
// bundle) and returns a generic {headers, rows} table for the column-mapping
// UI, capped at 500 preview rows regardless of file size.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const table = await parseCustomerFile(file.name, buffer)
    return NextResponse.json(table)
  } catch (err) {
    console.error('[customers/parse-file] failed', err)
    return NextResponse.json(
      { error: 'Impossible de lire ce fichier.', details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    )
  }
}
