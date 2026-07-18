/** Snapshot recent bills: Congress.gov (federal) + Open States (per state). */
import { congressBillUrl, type CongressBillRef } from '../src/lib/billLinks'
import type { BillsFile } from '../src/lib/staticShapes'
import type { Bill } from '../src/lib/types'
import { STATES_BY_FIPS } from '../src/lib/usStates'
import { env, fetchJson, nowIso, sleep, writeJson, type JobResult } from './lib'

interface CongressBill extends CongressBillRef {
  title?: string
  latestAction?: { actionDate?: string; text?: string }
}

export async function compileFederalBills(): Promise<JobResult> {
  const key = env('CONGRESS_GOV_API_KEY')
  if (!key) return { status: 'skipped', reason: 'CONGRESS_GOV_API_KEY not set' }

  const data = await fetchJson<{ bills?: CongressBill[] }>(
    `https://api.congress.gov/v3/bill?format=json&limit=15&api_key=${key}`
  )
  const bills: Bill[] = (data.bills ?? []).map((b, i) => ({
    id: b.type && b.number ? `${b.type.toUpperCase()} ${b.number}` : `bill-${i}`,
    title: b.title ?? '(untitled bill)',
    jurisdiction: 'U.S. Congress',
    lastAction: b.latestAction?.text,
    lastActionDate: b.latestAction?.actionDate,
    url: congressBillUrl(b),
    source: 'Congress.gov API'
  }))
  if (bills.length === 0) throw new Error('validation: Congress.gov returned no bills')
  const file: BillsFile = { generatedAt: nowIso(), bills }
  await writeJson('bills/us.json', file)
  return { status: 'ok', bills: bills.length }
}

interface OsBill {
  identifier?: string
  title?: string
  latest_action_description?: string
  latest_action_date?: string
  openstates_url?: string
}

export async function compileStateBills(): Promise<JobResult> {
  const key = env('OPENSTATES_API_KEY')
  if (!key) return { status: 'skipped', reason: 'OPENSTATES_API_KEY not set' }

  let statesWritten = 0
  for (const { abbr, name } of Object.values(STATES_BY_FIPS)) {
    try {
      const data = await fetchJson<{ results?: OsBill[] }>(
        `https://v3.openstates.org/bills?jurisdiction=${encodeURIComponent(
          name
        )}&sort=latest_action_desc&per_page=8`,
        { headers: { 'X-API-KEY': key } }
      )
      const bills: Bill[] = (data.results ?? []).map((b, i) => ({
        id: b.identifier ?? `bill-${i}`,
        title: b.title ?? '(untitled bill)',
        jurisdiction: name,
        lastAction: b.latest_action_description,
        lastActionDate: b.latest_action_date?.slice(0, 10),
        url: b.openstates_url,
        source: 'Open States (Plural)'
      }))
      if (bills.length > 0) {
        const file: BillsFile = { generatedAt: nowIso(), bills }
        await writeJson(`bills/${abbr.toLowerCase()}.json`, file)
        statesWritten++
      }
    } catch {
      // Jurisdictions Open States doesn't cover (most territories) — skip.
    }
    await sleep(1200) // stay well inside Open States rate limits
  }

  if (statesWritten < 40) {
    throw new Error(
      `validation: state bills compiled for only ${statesWritten} states (expected ≥ 40)`
    )
  }
  return { status: 'ok', states: statesWritten }
}
