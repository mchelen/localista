/** Congress.gov bill-page URL construction (shared by app and pipeline). */

const BILL_TYPE_SLUGS: Record<string, string> = {
  hr: 'house-bill',
  s: 'senate-bill',
  hjres: 'house-joint-resolution',
  sjres: 'senate-joint-resolution',
  hconres: 'house-concurrent-resolution',
  sconres: 'senate-concurrent-resolution',
  hres: 'house-resolution',
  sres: 'senate-resolution'
}

export interface CongressBillRef {
  congress?: number
  type?: string
  number?: string
}

export function congressBillUrl(b: CongressBillRef): string | undefined {
  const slug = b.type && BILL_TYPE_SLUGS[b.type.toLowerCase()]
  if (!slug || !b.congress || !b.number) return undefined
  return `https://www.congress.gov/bill/${b.congress}th-congress/${slug}/${b.number}`
}
