import { parseCdCode } from '../lib/civics'
import type { GeoContext, Jurisdiction, LatLng } from '../lib/types'
import { stateFromFips } from '../lib/usStates'
import { fetchJson } from './http'

const GEOCODER = 'https://geocoding.geo.census.gov/geocoder'

interface CensusGeography {
  GEOID?: string
  NAME?: string
  BASENAME?: string
  STATE?: string
  COUNTY?: string
  PLACE?: string
  [key: string]: unknown
}

interface GeographiesResponse {
  result?: { geographies?: Record<string, CensusGeography[]> }
}

interface OnelineAddressResponse {
  result?: {
    addressMatches?: Array<{
      matchedAddress?: string
      coordinates?: { x: number; y: number }
    }>
  }
}

/** Geocode a typed address to a point (Census one-line-address geocoder). */
export async function geocodeAddress(
  address: string
): Promise<{ point: LatLng; matchedAddress?: string }> {
  const url = `${GEOCODER}/locations/onelineaddress?address=${encodeURIComponent(
    address
  )}&benchmark=Public_AR_Current&format=json`
  const data = await fetchJson<OnelineAddressResponse>(url)
  const match = data.result?.addressMatches?.[0]
  if (!match?.coordinates) {
    throw new Error('No match for that address — try adding city and state.')
  }
  return {
    point: { lat: match.coordinates.y, lng: match.coordinates.x },
    matchedAddress: match.matchedAddress
  }
}

/**
 * Resolve a point into jurisdictions via the Census geographies lookup.
 * Geography layer keys vary by vintage ("119th Congressional Districts"…),
 * so layers are matched by name pattern rather than exact key.
 */
export async function resolveJurisdictions(point: LatLng): Promise<GeoContext> {
  const url = `${GEOCODER}/geographies/coordinates?x=${point.lng}&y=${point.lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`
  const data = await fetchJson<GeographiesResponse>(url)
  const geos = data.result?.geographies
  if (!geos) throw new Error('Census geocoder returned no geographies for this point.')

  const first = (pattern: RegExp): CensusGeography | undefined => {
    for (const [layerName, items] of Object.entries(geos)) {
      if (pattern.test(layerName) && items.length > 0) return items[0]
    }
    return undefined
  }

  const state = first(/^states$/i)
  const county = first(/^counties$/i)
  const place = first(/incorporated places|census designated places/i)
  const cd = first(/congressional district/i)
  const sldu = first(/legislative districts?\s*-?\s*upper/i)
  const sldl = first(/legislative districts?\s*-?\s*lower/i)

  const stateFips = state?.STATE ?? state?.GEOID
  const stateInfo = stateFromFips(stateFips)

  // The CD code lives in a vintage-named field (CD116, CD118, CD119…).
  const cdCode =
    cd &&
    (Object.entries(cd).find(([k]) => /^CD\d+$/i.test(k))?.[1] as string | undefined)
  const cdNumber = parseCdCode(cdCode ?? cd?.BASENAME)

  const jurisdictions: Jurisdiction[] = []
  const push = (
    kind: Jurisdiction['kind'],
    label: string,
    name: string | undefined,
    geoid?: string
  ) => {
    if (name) jurisdictions.push({ kind, label, name, geoid })
  }
  push('country', 'Country', 'United States')
  push('state', 'State', state?.NAME ?? stateInfo?.name, state?.GEOID)
  push('county', 'County', county?.NAME, county?.GEOID)
  push('place', 'City / Place', place?.NAME, place?.GEOID)
  push(
    'congressional-district',
    'Congressional District',
    cd?.NAME ??
      (cdNumber !== undefined && stateInfo
        ? `${stateInfo.abbr}-${cdNumber === 0 ? 'At large' : cdNumber}`
        : undefined),
    cd?.GEOID
  )
  push('state-upper', 'State Senate District', sldu?.NAME, sldu?.GEOID)
  push('state-lower', 'State House District', sldl?.NAME, sldl?.GEOID)

  return {
    point,
    stateFips,
    stateAbbr: stateInfo?.abbr,
    stateName: state?.NAME ?? stateInfo?.name,
    countyFips: county?.COUNTY,
    countyName: county?.NAME,
    placeFips: place?.PLACE,
    placeName: place?.NAME,
    cdNumber,
    slduName: sldu?.NAME,
    sldlName: sldl?.NAME,
    jurisdictions
  }
}
