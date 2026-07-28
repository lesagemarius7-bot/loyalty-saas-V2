import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedTable {
  headers: string[]
  /** Capped at MAX_ROWS — the mapping/preview UI only ever needs a sample, not the whole file in memory twice. */
  rows: Record<string, string>[]
  totalRows: number
  truncated: boolean
}

// Matches the zod array cap on /api/customers/import-bulk and
// /api/webhooks/customers/sync — a file with more rows than this only gets
// its first MAX_ROWS imported; the modal surfaces `truncated` so the
// merchant isn't left guessing why a count came up short.
const MAX_ROWS = 2000

function toTable(headers: string[], allRows: Record<string, string>[]): ParsedTable {
  return {
    headers,
    rows: allRows.slice(0, MAX_ROWS),
    totalRows: allRows.length,
    truncated: allRows.length > MAX_ROWS,
  }
}

function parseCsv(buffer: Buffer): ParsedTable {
  const text = buffer.toString('utf-8')
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [',', ';', '\t', '|'],
  })
  const headers = result.meta.fields ?? []
  return toTable(headers, result.data)
}

function parseExcel(buffer: Buffer): ParsedTable {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return toTable([], [])
  const sheet = workbook.Sheets[firstSheetName]!

  // header:1 gives the raw first row as an array — this is what defines the
  // column names, independent of how sheet_to_json's object-mode handles
  // duplicate/empty header cells.
  const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as unknown[] | undefined) ?? []
  const headers = headerRow.map((h, i) => (h === undefined || h === null || h === '' ? `Colonne ${i + 1}` : String(h)))

  // raw:false formats numbers/dates as displayed strings (a phone number
  // read as a raw number would silently lose a leading 0), defval keeps rows
  // with trailing blank cells the same width as the header row.
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: '', header: headers, range: 1 })
  return toTable(headers, rows)
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE_PATTERN = /(?:\+33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/

// PDFs (invoice/list exports) have no reliable column structure, so this
// only ever extracts what the spec asked for: emails and phone numbers, via
// regex — one row per line that contains an email and/or phone, pairing the
// two only when they appear on the same line (the common case for a
// one-row-per-customer list export). No attempt at real table/column
// extraction — that would be pretending a level of structure this approach
// can't honestly guarantee.
async function parsePdf(buffer: Buffer): Promise<ParsedTable> {
  // pdf-parse pulls in pdfjs-dist, which runs `new DOMMatrix()` at module
  // top-level for its canvas rendering path — a browser API that doesn't
  // exist in Vercel's Node.js runtime, so a static top-of-file import would
  // crash every file type, not just PDFs. Dynamic import here defers that
  // evaluation until an actual PDF is uploaded, and the stub below only
  // needs to survive being constructed: we only ever call getText(), never
  // the rendering methods that would need it to do real matrix math.
  if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrixStub {
      constructor() {}
    } as unknown as typeof DOMMatrix
  }
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    const lines = result.text.split('\n')
    const rows: Record<string, string>[] = []
    const seenEmails = new Set<string>()

    for (const line of lines) {
      const emailMatch = line.match(EMAIL_PATTERN)
      const phoneMatch = line.match(PHONE_PATTERN)
      if (!emailMatch && !phoneMatch) continue

      const email = emailMatch?.[0] ?? ''
      if (email && seenEmails.has(email)) continue
      if (email) seenEmails.add(email)

      rows.push({ email, phone: phoneMatch?.[0] ?? '' })
    }

    return toTable(['email', 'phone'], rows)
  } finally {
    await parser.destroy()
  }
}

export async function parseCustomerFile(filename: string, buffer: Buffer): Promise<ParsedTable> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCsv(buffer)
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(buffer)
  if (ext === 'pdf') return parsePdf(buffer)
  throw new Error(`Format de fichier non supporté : .${ext ?? '?'} (attendu : .csv, .xlsx, .xls ou .pdf)`)
}
