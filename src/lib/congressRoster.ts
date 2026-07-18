/**
 * Pure mapping from the unitedstates/congress-legislators dataset to the
 * Localista Representative model. Shared by the runtime adapter
 * (services/federal.ts fallback path) and the build-time pipeline.
 */
import { electionForTermEnd } from './civics'
import type { Representative } from './types'

export const LEGISLATORS_CURRENT_URL =
  'https://unitedstates.github.io/congress-legislators/legislators-current.json'
export const CONGRESS_ROSTER_SOURCE = 'unitedstates/congress-legislators'

export interface LegislatorTerm {
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

export interface Legislator {
  id: { bioguide?: string }
  name: { official_full?: string; first?: string; last?: string }
  terms: LegislatorTerm[]
}

export function currentTerm(person: Legislator): LegislatorTerm | undefined {
  return person.terms[person.terms.length - 1]
}

export function legislatorToRepresentative(
  person: Legislator,
  term: LegislatorTerm
): Representative {
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
    source: CONGRESS_ROSTER_SOURCE
  }
}
