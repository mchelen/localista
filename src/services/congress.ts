import { congressBillUrl, type CongressBillRef } from '../lib/billLinks'
import type { BillsFile } from '../lib/staticShapes'
import type { Bill } from '../lib/types'
import { env, fetchJson } from './http'
import { fetchStatic } from './staticData'

const SOURCE = 'Congress.gov API'

interface CongressBill extends CongressBillRef {
  title?: string
  latestAction?: { actionDate?: string; text?: string }
}

export function congressGovKey(): string | undefined {
  return env('VITE_CONGRESS_GOV_API_KEY')
}

/**
 * Bills in Congress with the most recent actions: precompiled snapshot
 * first (refreshed by CI, no key in the client), live API as fallback.
 */
export async function getFederalBills(): Promise<Bill[]> {
  const staticFile = await fetchStatic<BillsFile>('data/bills/us.json')
  if (staticFile && staticFile.bills.length > 0) return staticFile.bills

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
    url: congressBillUrl(b),
    source: SOURCE
  }))
}
