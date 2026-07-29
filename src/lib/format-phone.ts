// This app's merchants and customers are French (business_name examples,
// French-only UI throughout) so the one real format worth normalizing is
// French mobile/landline: "0612345678" or "+33612345678" -> "+33 6 12 34 56 78".
// Anything that doesn't match is shown as-is rather than mangled — a phone
// number in an unexpected format is still more useful raw than silently
// dropped or garbled by a formatter that assumed the wrong shape.
export function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')

  let national: string | null = null
  if (/^0\d{9}$/.test(digits)) {
    national = digits.slice(1)
  } else if (/^\+33\d{9}$/.test(digits)) {
    national = digits.slice(3)
  } else if (/^33\d{9}$/.test(digits)) {
    national = digits.slice(2)
  }

  if (!national) return raw

  const firstDigit = national[0]
  const rest = national.slice(1).match(/.{1,2}/g) ?? []
  return `+33 ${firstDigit} ${rest.join(' ')}`
}
