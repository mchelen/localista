import { electionForTermEnd } from '../lib/civics'
import type { GeoContext, Representative } from '../lib/types'
import { fetchJson } from './http'

const LEGISLATORS_URL =
  'https://unitedstates.github.io/congress-legislators/legislators-current.json'
const SOURCE = 'unitedstates/congress-legislators'

interface LegislatorTerm {
  type: 'rep' | 'sen'
  start: string
  end: string
  state: string
  district?: number
  party?: string
  phone?: string
  url?: string
  contact_form?: string
  address?: string
}

interface Legislator {
  id: { bioguide?: string }
  name: { official_full?: string; first?: string; last?: string }
  terms: LegislatorTerm[]
}

let cache: Legislator[] | undefined

async function loadLegislators(): Promise<Legislator[]> {
  if (!cache) {
    cache = await fetchJson<Legislator[]>(LEGISLATORS_URL, { timeoutMs: 30000 })
  }
  return cache
}

function toRepresentative(person: Legislator, term: LegislatorTerm): Representative {
  const isSenator = term.type === 'sen'
  const districtLabel =
    term.district === undefined || term.district === 0 ? 'At large' : `${term.district}`
  const bioguide = person.id.bioguide
  return {
    level: 'federal',
    office: isSenator
      ? 'U.S. Senator'
      : term.state === 'DC'
        ? 'Delegate to the U.S. House (non-voting)'
        : 'U.S. Representative',
    name:
      person.name.official_full ??
      [person.name.first, person.name.last].filter(Boolean).join(' '),
    party: term.party,
    jurisdiction: isSenator ? term.state : `${term.state}-${districtLabel}`,
    termStart: term.start,
    termEnd: term.end,
    phone: term.phone,
    website: term.url,
    contactForm: term.contact_form,
    address: term.address,
    photoUrl: bioguide
      ? `https://unitedstates.github.io/images/congress/225x275/${bioguide}.jpg`
      : undefined,
    nextElection: electionForTermEnd(term.end),
    source: SOURCE
  }
}

/**
 * Federal delegation for the resolved location: both senators (none for DC
 * and the territories) plus the House member/delegate for the district.
 */
export async function getFederalReps(geo: GeoContext): Promise<Representative[]> {
  if (!geo.stateAbbr) throw new Error('State could not be determined for this point.')
  const legislators = await loadLegislators()
  const reps: Representative[] = []

  for (const person of legislators) {
    const term = person.terms[person.terms.length - 1]
    if (!term || term.state !== geo.stateAbbr) continue
    if (term.type === 'sen') {
      reps.push(toRepresentative(person, term))
    } else if (
      geo.cdNumber !== undefined &&
      (term.district ?? 0) === geo.cdNumber
    ) {
      reps.push(toRepresentative(person, term))
    }
  }

  // Senators first, then House member.
  reps.sort((a, b) =>
    a.office === b.office ? a.name.localeCompare(b.name) : a.office.includes('Senator') ? -1 : 1
  )
  return reps
}
