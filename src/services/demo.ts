import { dcElectedExecutives, dcResources } from '../data/dcCurated'
import { NATIONAL_RESOURCES } from './local'
import type {
  Bill,
  CivicResource,
  ElectionInfo,
  GeoContext,
  JurisdictionDemographics,
  Representative
} from '../lib/types'

/**
 * Bundled sample data (Washington, DC — Eastern Market area) so the app can
 * be evaluated without granting location access or reaching any network.
 * Clearly labeled as sample data in the UI; names below are historical or
 * illustrative, not live data.
 */
export const DEMO_LABEL = 'Sample data · Washington, DC (Eastern Market)'
const SOURCE = 'Bundled sample data'

export const demoGeo: GeoContext = {
  point: { lat: 38.8863, lng: -76.9961 },
  matchedAddress: '7th St SE & C St SE, Washington, DC 20003 (sample)',
  stateFips: '11',
  stateAbbr: 'DC',
  stateName: 'District of Columbia',
  countyFips: '001',
  countyName: 'District of Columbia',
  placeFips: '50000',
  placeName: 'Washington city',
  cdNumber: 0,
  jurisdictions: [
    { kind: 'country', label: 'Country', name: 'United States' },
    { kind: 'state', label: 'State', name: 'District of Columbia', geoid: '11' },
    { kind: 'place', label: 'City / Place', name: 'Washington city', geoid: '1150000' },
    {
      kind: 'congressional-district',
      label: 'Congressional District',
      name: 'Delegate District (at Large)'
    },
    { kind: 'ward', label: 'Ward', name: 'Ward 6' },
    { kind: 'anc', label: 'ANC', name: 'ANC 6B' },
    { kind: 'smd', label: 'ANC Single Member District', name: 'SMD 6B02' }
  ]
}

export const demoReps: Representative[] = [
  // Citywide elected executives (curated data doubles as demo data).
  ...dcElectedExecutives,
  {
    level: 'federal',
    office: 'Delegate to the U.S. House (non-voting)',
    name: 'Eleanor Holmes Norton',
    party: 'Democrat',
    jurisdiction: 'DC-At large',
    termStart: '2025-01-03',
    termEnd: '2027-01-03',
    phone: '202-225-8050',
    website: 'https://norton.house.gov',
    nextElection: '2026-11-03',
    source: SOURCE
  },
  {
    level: 'state',
    office: 'DC Councilmember',
    name: 'Charles Allen',
    party: 'Democrat',
    jurisdiction: 'Ward 6',
    phone: '202-724-8072',
    email: 'callen@dccouncil.gov',
    website: 'https://dccouncil.gov',
    source: SOURCE
  },
  {
    level: 'local',
    office: 'ANC Commissioner',
    name: 'Sample Commissioner',
    jurisdiction: 'SMD 6B02',
    email: '6B02@anc.dc.gov',
    website: 'https://anc.dc.gov/',
    nextElection: 'ANC seats are on the DC general-election ballot in even years',
    source: SOURCE
  }
]

export const demoBills: Bill[] = [
  {
    id: 'H.R. 51',
    title: 'Washington, D.C. Admission Act (sample)',
    jurisdiction: 'U.S. Congress',
    lastAction: 'Referred to committee',
    lastActionDate: '2026-02-11',
    url: 'https://www.congress.gov',
    source: SOURCE
  },
  {
    id: 'B26-0104',
    title: 'Sample DC Council measure under consideration',
    jurisdiction: 'District of Columbia',
    lastAction: 'Public hearing scheduled',
    lastActionDate: '2026-06-30',
    url: 'https://lims.dccouncil.gov',
    source: SOURCE
  }
]

export const demoElections: ElectionInfo[] = [
  {
    name: 'DC primary election (sample)',
    date: '2026-06-02',
    jurisdiction: 'District of Columbia',
    source: SOURCE
  },
  {
    name: 'Federal general election',
    date: '2026-11-03',
    jurisdiction: 'United States',
    source: SOURCE
  }
]

export const demoResources: CivicResource[] = [...dcResources, ...NATIONAL_RESOURCES]

export const demoDemographics: JurisdictionDemographics[] = [
  {
    jurisdictionName: 'District of Columbia',
    level: 'State',
    rows: [
      { label: 'Population', value: '678,972' },
      { label: 'Median age', value: '34.8' },
      { label: 'Median household income', value: '$106,287' },
      { label: "Bachelor's degree or higher", value: '63.9%' },
      { label: 'Unemployment rate', value: '5.6%' }
    ],
    source: SOURCE
  },
  {
    jurisdictionName: 'Washington city, District of Columbia',
    level: 'City / Place',
    rows: [
      { label: 'Population', value: '678,972' },
      { label: 'Median household income', value: '$106,287' }
    ],
    source: SOURCE
  }
]
