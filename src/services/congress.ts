import type { Bill } from '../lib/types'
import { env, fetchJson } from './http'

const SOURCE = 'Congress.gov API'

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

interface CongressBill {
  congress?: number
  type?: string
  number?: string
  title?: string
  latestAction?: { actionDate?: string; text?: string }
}

export function congressGovKey(): string | undefined {
  return env('VITE_CONGRESS_GOV_API_KEY')
}

export function billUrl(b: CongressBill): string | undefined {
  const slug = b.type && BILL_TYPE_SLUGS[b.type.toLowerCase()]
  if (!slug || !b.congress || !b.number) return undefined
  return `https://www.congress.gov/bill/${b.congress}th-congress/${slug}/${b.number}`
}

/** Bills in Congress with the most recent actions. */
export async function getFederalBills(): Promise<Bill[]> {
  const key = congressGovKey()
  if (!key) throw new Error('missing-key')
  const url = `https://api.congress.gov/v3/bill?format=json&limit=10&api_key=${key}`
  const data = await fetchJson<{ bills?: CongressBill[] }>(url)
  return (data.bills ?? []).map((b, i) => ({
    id: b.type && b.number ? `${b.type.toUpperCase()} ${b.number}` : `bill-${i}`,
    title: b.title ?? '(untitled bill)',
    jurisdiction: 'U.S. Congress',
    lastAction: b.latestAction?.text,
    lastActionDate: b.latestAction?.actionDate,
    url: billUrl(b),
    source: SOURCE
  }))
}
