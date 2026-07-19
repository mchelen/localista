import type {
  Bill,
  CivicResource,
  ElectionInfo,
  GeoContext,
  Jurisdiction,
  JurisdictionDemographics,
  Representative
} from './types'

/**
 * Locality-first information architecture (docs/UX_DESIGN.md §6): the
 * home page presents one section per level of government, sorted MOST
 * local → LEAST local, and every piece of data (representatives,
 * services, bills, elections, jurisdiction facts) is classified into the
 * level it belongs to — so the city section shows the city's reps next
 * to the city's services and the city's next election.
 *
 * DC quirk: the District's city government also holds state-level powers
 * (DC Council legislates like a state legislature), so for DC locations
 * everything state-classified folds into the city section.
 */

export type CivicLevel = 'neighborhood' | 'city' | 'county' | 'state' | 'federal'

/** Most local first — the page's section order. */
export const LEVEL_ORDER: CivicLevel[] = [
  'neighborhood',
  'city',
  'county',
  'state',
  'federal'
]

export function isDc(geo: GeoContext): boolean {
  return geo.stateAbbr === 'DC' || geo.stateFips === '11'
}

/** Fold 'state' into 'city' for DC locations. */
export function stateish(geo: GeoContext): CivicLevel {
  return isDc(geo) ? 'city' : 'state'
}

/** DC's "county" is a legal fiction (same territory as the city). */
function countyish(geo: GeoContext): CivicLevel {
  return isDc(geo) ? 'city' : 'county'
}

const NEIGHBORHOOD_RE = /\banc\b|\bsmd\b|single member|advisory neighborhood|neighborhood/i

export function classifyRep(rep: Representative, geo: GeoContext): CivicLevel {
  if (rep.level === 'federal') return 'federal'
  const seat = `${rep.office} ${rep.jurisdiction ?? ''}`
  if (rep.level === 'local') {
    return NEIGHBORHOOD_RE.test(seat) ? 'neighborhood' : 'city'
  }
  return stateish(geo)
}

export function classifyResource(res: CivicResource, geo: GeoContext): CivicLevel {
  if (NEIGHBORHOOD_RE.test(res.label)) return 'neighborhood'
  const j = res.jurisdiction ?? ''
  if (/united states/i.test(j)) return 'federal'
  if (geo.stateName && j.toLowerCase() === geo.stateName.toLowerCase()) {
    return stateish(geo)
  }
  if (geo.countyName && j.toLowerCase().includes(geo.countyName.toLowerCase())) {
    return countyish(geo)
  }
  // City-scoped links ("Washington, DC", "Chicago, IL", …) and anything
  // unrecognized: the city section is the safest, most-used home.
  return 'city'
}

export function classifyBill(bill: Bill, geo: GeoContext): CivicLevel {
  if (/u\.s\.|congress|united states/i.test(bill.jurisdiction)) return 'federal'
  return stateish(geo)
}

export function classifyElection(e: ElectionInfo, geo: GeoContext): CivicLevel {
  const j = e.jurisdiction ?? ''
  if (/united states/i.test(j) || /\bfederal\b|\bpresidential\b/i.test(e.name)) {
    return 'federal'
  }
  if (geo.countyName && j.toLowerCase().includes(geo.countyName.toLowerCase())) {
    return countyish(geo)
  }
  return stateish(geo)
}

export function classifyDemographics(
  d: JurisdictionDemographics,
  geo: GeoContext
): CivicLevel {
  if (/state/i.test(d.level)) return stateish(geo)
  if (/county/i.test(d.level)) return countyish(geo)
  return 'city'
}

/** Which of the user's jurisdictions belong in each level's header. */
export function classifyJurisdiction(j: Jurisdiction, geo: GeoContext): CivicLevel | undefined {
  switch (j.kind) {
    case 'anc':
    case 'smd':
      return 'neighborhood'
    case 'place':
    case 'ward':
      return 'city'
    case 'county':
      return countyish(geo)
    case 'state':
    case 'state-upper':
    case 'state-lower':
      return stateish(geo)
    case 'congressional-district':
    case 'country':
      return 'federal'
    default:
      return undefined
  }
}

/** Human title for a level's section, e.g. "Your city · Washington". */
export function levelTitle(level: CivicLevel, geo: GeoContext): string {
  switch (level) {
    case 'neighborhood':
      return 'Your neighborhood'
    case 'city': {
      const name = geo.placeName?.replace(/\s+(city|town|village|borough|CDP)$/i, '')
      if (isDc(geo)) return 'Your city · Washington, DC'
      return name ? `Your city · ${name}` : 'Your city'
    }
    case 'county':
      return geo.countyName ? `Your county · ${geo.countyName}` : 'Your county'
    case 'state':
      return geo.stateName ? `Your state · ${geo.stateName}` : 'Your state'
    case 'federal':
      return 'Federal · United States'
  }
}

/** One-line context under a section title, when the level needs it. */
export function levelSubtitle(level: CivicLevel, geo: GeoContext): string | undefined {
  if (level === 'city' && isDc(geo)) {
    return 'DC’s city government also holds state-level powers, so DC Council and citywide offices live here.'
  }
  return undefined
}
