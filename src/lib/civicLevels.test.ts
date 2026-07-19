import { describe, expect, it } from 'vitest'
import {
  classifyBill,
  classifyDemographics,
  classifyElection,
  classifyJurisdiction,
  classifyRep,
  classifyResource,
  LEVEL_ORDER,
  levelTitle
} from './civicLevels'
import type { GeoContext, Representative } from './types'

const dc: GeoContext = {
  point: { lat: 38.886, lng: -76.996 },
  stateFips: '11',
  stateAbbr: 'DC',
  stateName: 'District of Columbia',
  countyName: 'District of Columbia',
  placeName: 'Washington city',
  jurisdictions: [
    { kind: 'country', label: 'Country', name: 'United States' },
    { kind: 'state', label: 'State', name: 'District of Columbia' },
    { kind: 'place', label: 'City / Place', name: 'Washington city' },
    { kind: 'ward', label: 'Ward', name: 'Ward 6' },
    { kind: 'anc', label: 'ANC', name: 'ANC 6B' },
    { kind: 'smd', label: 'ANC Single Member District', name: 'SMD 6B02' }
  ]
}

const md: GeoContext = {
  point: { lat: 39, lng: -77 },
  stateFips: '24',
  stateAbbr: 'MD',
  stateName: 'Maryland',
  countyName: 'Montgomery County',
  placeName: 'Rockville city',
  jurisdictions: [
    { kind: 'country', label: 'Country', name: 'United States' },
    { kind: 'state', label: 'State', name: 'Maryland' },
    { kind: 'county', label: 'County', name: 'Montgomery County' },
    { kind: 'place', label: 'City / Place', name: 'Rockville city' },
    { kind: 'congressional-district', label: 'Congressional District', name: 'MD-8' }
  ]
}

const rep = (over: Partial<Representative>): Representative => ({
  level: 'state',
  office: 'Senator',
  name: 'Test Person',
  source: 'test',
  ...over
})

describe('classifyRep', () => {
  it('sorts federal, state, city, neighborhood correctly', () => {
    expect(classifyRep(rep({ level: 'federal', office: 'U.S. Senator' }), md)).toBe(
      'federal'
    )
    expect(classifyRep(rep({ level: 'state', office: 'State Delegate' }), md)).toBe(
      'state'
    )
    expect(classifyRep(rep({ level: 'local', office: 'Mayor' }), dc)).toBe('city')
    expect(
      classifyRep(rep({ level: 'local', office: 'ANC Commissioner', jurisdiction: 'SMD 6B02' }), dc)
    ).toBe('neighborhood')
  })

  it('folds DC Council (state-level data) into the city section', () => {
    expect(classifyRep(rep({ level: 'state', office: 'DC Councilmember' }), dc)).toBe(
      'city'
    )
  })
})

describe('classifyResource', () => {
  it('maps national, state, and ANC resources', () => {
    expect(classifyResource({ label: 'USA.gov', url: 'u', jurisdiction: 'United States' }, md)).toBe('federal')
    expect(classifyResource({ label: 'State portal', url: 'u', jurisdiction: 'Maryland' }, md)).toBe('state')
    expect(classifyResource({ label: 'Your ANC', url: 'u', jurisdiction: 'Washington, DC' }, dc)).toBe('neighborhood')
    expect(classifyResource({ label: '311 — city services', url: 'u', jurisdiction: 'Washington, DC' }, dc)).toBe('city')
  })
})

describe('classifyBill / classifyElection', () => {
  it('separates Congress from state legislatures, DC folding to city', () => {
    const congress = { id: '1', title: 't', jurisdiction: 'U.S. Congress', source: 's' }
    const dcBill = { id: '2', title: 't', jurisdiction: 'District of Columbia', source: 's' }
    expect(classifyBill(congress, md)).toBe('federal')
    expect(classifyBill(dcBill, dc)).toBe('city')
    expect(classifyBill({ ...dcBill, jurisdiction: 'Maryland' }, md)).toBe('state')
  })

  it('classifies elections by jurisdiction and name', () => {
    expect(
      classifyElection({ name: 'Federal general election', date: '2026-11-03', jurisdiction: 'United States', source: 's' }, md)
    ).toBe('federal')
    expect(
      classifyElection({ name: 'DC primary election', date: '2026-06-02', jurisdiction: 'District of Columbia', source: 's' }, dc)
    ).toBe('city')
    expect(
      classifyElection({ name: 'State primary', date: '2026-06-02', jurisdiction: 'Maryland', source: 's' }, md)
    ).toBe('state')
  })
})

describe('classifyDemographics / classifyJurisdiction', () => {
  it("folds DC's vestigial county into the city", () => {
    const county = { jurisdictionName: 'x', level: 'County', rows: [], source: 's' }
    expect(classifyDemographics(county, dc)).toBe('city')
    expect(classifyDemographics(county, md)).toBe('county')
  })

  it('assigns districts to level sections, CD to federal', () => {
    const byKind = Object.fromEntries(
      md.jurisdictions.map((j) => [j.kind, classifyJurisdiction(j, md)])
    )
    expect(byKind['congressional-district']).toBe('federal')
    expect(byKind['county']).toBe('county')
    expect(byKind['place']).toBe('city')
  })
})

describe('levelTitle / LEVEL_ORDER', () => {
  it('is ordered most local → least local', () => {
    expect(LEVEL_ORDER[0]).toBe('neighborhood')
    expect(LEVEL_ORDER[LEVEL_ORDER.length - 1]).toBe('federal')
  })

  it('cleans Census place suffixes and special-cases DC', () => {
    expect(levelTitle('city', md)).toBe('Your city · Rockville')
    expect(levelTitle('city', dc)).toBe('Your city · Washington, DC')
    expect(levelTitle('state', md)).toBe('Your state · Maryland')
  })
})
