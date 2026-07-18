import type { BillsFile } from '../lib/staticShapes'
import type { Bill, GeoContext, LatLng, Representative } from '../lib/types'
import { env, fetchJson } from './http'
import { fetchStatic } from './staticData'

const BASE = 'https://v3.openstates.org'
const SOURCE = 'Open States (Plural)'

export function openStatesKey(): string | undefined {
  return env('VITE_OPENSTATES_API_KEY')
}

interface OsOffice {
  classification?: string
  address?: string
  voice?: string
}

interface OsPerson {
  name: string
  party?: string
  email?: string
  image?: string
  current_role?: {
    title?: string
    org_classification?: string // 'upper' | 'lower' | 'legislature'
    district?: string | number
  }
  offices?: OsOffice[]
  openstates_url?: string
}

/** State legislators (incl. DC Council) whose districts contain the point. */
export async function getStateReps(point: LatLng): Promise<Representative[]> {
  const key = openStatesKey()
  if (!key) throw new Error('missing-key')
  const url = `${BASE}/people.geo?lat=${point.lat}&lng=${point.lng}&include=offices`
  const data = await fetchJson<{ results?: OsPerson[] }>(url, {
    headers: { 'X-API-KEY': key }
  })
  return (data.results ?? []).map((p) => {
    const office = p.offices?.[0]
    const chamber = p.current_role?.org_classification
    const title =
      p.current_role?.title ??
      (chamber === 'upper' ? 'State Senator' : chamber === 'lower' ? 'State Representative' : 'Legislator')
    return {
      level: 'state' as const,
      office: title,
      name: p.name,
      party: p.party,
      jurisdiction: p.current_role?.district ? `District ${p.current_role.district}` : undefined,
      phone: office?.voice,
      address: office?.address,
      email: p.email,
      website: p.openstates_url,
      photoUrl: p.image,
      source: SOURCE
    }
  })
}

interface OsBill {
  identifier?: string
  title?: string
  latest_action_description?: string
  latest_action_date?: string
  openstates_url?: string
}

/**
 * Most recently active bills in the state legislature (or DC Council):
 * precompiled snapshot first, live Open States API as fallback.
 */
export async function getStateBills(geo: GeoContext): Promise<Bill[]> {
  if (geo.stateAbbr) {
    const staticFile = await fetchStatic<BillsFile>(
      `data/bills/${geo.stateAbbr.toLowerCase()}.json`
    )
    if (staticFile && staticFile.bills.length > 0) return staticFile.bills
  }

  const key = openStatesKey()
  if (!key) throw new Error('missing-key')
  if (!geo.stateName) throw new Error('State could not be determined.')
  const url = `${BASE}/bills?jurisdiction=${encodeURIComponent(
    geo.stateName
  )}&sort=latest_action_desc&per_page=10`
  const data = await fetchJson<{ results?: OsBill[] }>(url, {
    headers: { 'X-API-KEY': key }
  })
  return (data.results ?? []).map((b, i) => ({
    id: b.identifier ?? `bill-${i}`,
    title: b.title ?? '(untitled bill)',
    jurisdiction: geo.stateName ?? 'State',
    lastAction: b.latest_action_description,
    lastActionDate: b.latest_action_date?.slice(0, 10),
    url: b.openstates_url,
    source: SOURCE
  }))
}
