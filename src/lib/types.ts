export interface LatLng {
  lat: number
  lng: number
}

export type JurisdictionKind =
  | 'country'
  | 'state'
  | 'county'
  | 'place'
  | 'congressional-district'
  | 'state-upper'
  | 'state-lower'
  | 'ward'
  | 'anc'
  | 'smd'
  | 'other'

export interface Jurisdiction {
  kind: JurisdictionKind
  label: string // "State", "Ward", "ANC"…
  name: string // "Maryland", "Ward 6", "ANC 6B"…
  geoid?: string
}

export interface GeoContext {
  point: LatLng
  matchedAddress?: string
  stateFips?: string
  stateAbbr?: string
  stateName?: string
  countyFips?: string
  countyName?: string
  placeFips?: string
  placeName?: string
  /** Congressional district number; 0 = at-large or non-voting delegate. */
  cdNumber?: number
  slduName?: string
  sldlName?: string
  jurisdictions: Jurisdiction[]
}

export type RepLevel = 'federal' | 'state' | 'local'

export interface Representative {
  level: RepLevel
  office: string // "U.S. Senator", "ANC Commissioner"…
  name: string
  party?: string
  /** Seat label, e.g. "Maryland", "MD-08", "SMD 6B03". */
  jurisdiction?: string
  termStart?: string // ISO date
  termEnd?: string // ISO date
  phone?: string
  email?: string
  website?: string
  contactForm?: string
  address?: string
  photoUrl?: string
  /** ISO date or human description of the seat's next regular election. */
  nextElection?: string
  source: string
}

export interface Bill {
  id: string
  title: string
  jurisdiction: string // "U.S. Congress", "Maryland", "District of Columbia"…
  lastAction?: string
  lastActionDate?: string
  url?: string
  source: string
}

export interface ElectionInfo {
  name: string
  date: string // ISO date
  jurisdiction?: string
  source: string
}

export interface DemographicRow {
  label: string
  value: string
}

export interface JurisdictionDemographics {
  jurisdictionName: string
  level: string // "State", "County", "City/Place"
  rows: DemographicRow[]
  source: string
}

/** Per-panel async state: each data panel loads and fails independently. */
export type Loadable<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; reason: string } // e.g. missing API key
  | { status: 'error'; message: string }
