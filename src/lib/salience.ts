/**
 * Salience model v1: curated tier heuristic ranking officials by practical
 * impact on the user's daily life (docs/UX_DESIGN.md §2). v2 (roadmap)
 * blends in attention metrics (Wikipedia pageviews, GDELT news mentions)
 * computed by the pipeline.
 */
import { normalizeDistrict } from './districts'
import type { GeoContext, Representative } from './types'

export type SalienceTier = 1 | 2 | 3

/** The user's ward/local district key, if the location resolved one. */
function userWardKey(geo: GeoContext): string | undefined {
  const ward = geo.jurisdictions.find((j) => j.kind === 'ward')
  return normalizeDistrict(ward?.name)
}

/**
 * Tier 1 = key officials (executive power or the user's own district seat
 * on the city legislature); Tier 2 = high relevance (federal delegation,
 * citywide seats); Tier 3 = reference (everyone else).
 */
export function salienceTier(rep: Representative, geo: GeoContext): SalienceTier {
  const office = rep.office.toLowerCase()

  // Local/state executives with direct service power.
  if (/\b(mayor|governor|attorney general)\b/.test(office)) return 1

  // City-legislature seats (e.g. DC Council): the user's OWN ward seat is
  // tier 1; citywide (at-large/chair) seats are tier 2.
  if (/councilmember|council member|city council/.test(office)) {
    const wardKey = userWardKey(geo)
    const seatKey = normalizeDistrict(rep.jurisdiction)
    if (wardKey !== undefined && seatKey !== undefined && wardKey === seatKey) return 1
    return 2
  }

  if (rep.level === 'federal') return 2

  return 3
}

/** Order helper: tier ascending, then name for stability. */
export function bySalience(geo: GeoContext) {
  return (a: Representative, b: Representative): number => {
    const ta = salienceTier(a, geo)
    const tb = salienceTier(b, geo)
    return ta === tb ? a.name.localeCompare(b.name) : ta - tb
  }
}
