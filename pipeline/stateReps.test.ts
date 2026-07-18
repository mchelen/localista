import { describe, expect, it } from 'vitest'
import { personToEntry, type OsPersonYaml } from './stateReps'

const TODAY = '2026-07-18'

const senator: OsPersonYaml = {
  name: 'Jane Q. Senator',
  email: 'jane@senate.example',
  image: 'https://example.com/jane.jpg',
  party: [{ name: 'Republican', end_date: '2020-01-01' }, { name: 'Democratic' }],
  roles: [
    { type: 'lower', district: '14', jurisdiction: 'ocd-jurisdiction/country:us/state:md/government', end_date: '2023-01-11' },
    { type: 'upper', district: '21', jurisdiction: 'ocd-jurisdiction/country:us/state:md/government', start_date: '2023-01-11', end_date: '2027-01-13' }
  ],
  offices: [{ classification: 'capitol', voice: '410-555-0100', address: '100 State Cir' }],
  links: [{ url: 'https://senate.example/jane' }]
}

describe('personToEntry', () => {
  it('maps a current upper-chamber role', () => {
    const entry = personToEntry(senator, 'md', TODAY)
    expect(entry).toBeDefined()
    expect(entry!.chamber).toBe('upper')
    expect(entry!.districtKey).toBe('21')
    expect(entry!.rep).toMatchObject({
      level: 'state',
      office: 'State Senator',
      name: 'Jane Q. Senator',
      party: 'Democratic',
      phone: '410-555-0100',
      website: 'https://senate.example/jane',
      termEnd: '2027-01-13',
      nextElection: '2026-11-03'
    })
  })

  it('skips people whose legislative roles have all ended', () => {
    const retired: OsPersonYaml = {
      name: 'Old Timer',
      roles: [{ type: 'upper', district: '3', end_date: '2019-01-01' }]
    }
    expect(personToEntry(retired, 'md', TODAY)).toBeUndefined()
  })

  it('normalizes DC ward districts and titles councilmembers', () => {
    const cm: OsPersonYaml = {
      name: 'Ward Member',
      roles: [{ type: 'legislature', district: 'Ward 6' }]
    }
    const entry = personToEntry(cm, 'dc', TODAY)
    expect(entry!.chamber).toBe('legislature')
    expect(entry!.districtKey).toBe('6')
    expect(entry!.rep.office).toBe('DC Councilmember')
    expect(entry!.rep.jurisdiction).toBe('Ward 6')
  })

  it('falls back to legacy contact_details', () => {
    const legacy: OsPersonYaml = {
      name: 'Legacy Contact',
      roles: [{ type: 'lower', district: '2' }],
      contact_details: [{ voice: '555-0101', address: '1 Capitol Way' }]
    }
    const entry = personToEntry(legacy, 'vt', TODAY)
    expect(entry!.rep.phone).toBe('555-0101')
    expect(entry!.rep.address).toBe('1 Capitol Way')
  })
})
