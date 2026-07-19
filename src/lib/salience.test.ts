import { describe, expect, it } from 'vitest'
import { salienceTier } from './salience'
import type { GeoContext, Representative } from './types'

const geo: GeoContext = {
  point: { lat: 38.88, lng: -76.99 },
  stateAbbr: 'DC',
  jurisdictions: [
    { kind: 'state', label: 'State', name: 'District of Columbia' },
    { kind: 'ward', label: 'Ward', name: 'Ward 6' }
  ]
}

const rep = (office: string, over: Partial<Representative> = {}): Representative => ({
  level: 'state',
  office,
  name: 'X',
  source: 't',
  ...over
})

describe('salienceTier', () => {
  it('puts executives in tier 1', () => {
    expect(salienceTier(rep('Mayor', { level: 'local' }), geo)).toBe(1)
    expect(salienceTier(rep('Attorney General of the District of Columbia'), geo)).toBe(1)
    expect(salienceTier(rep('Governor'), geo)).toBe(1)
  })

  it("puts the user's own ward councilmember in tier 1, citywide seats in tier 2", () => {
    expect(salienceTier(rep('DC Councilmember', { jurisdiction: 'Ward 6' }), geo)).toBe(1)
    expect(salienceTier(rep('DC Councilmember', { jurisdiction: 'Ward 3' }), geo)).toBe(2)
    expect(salienceTier(rep('DC Councilmember', { jurisdiction: 'At-Large' }), geo)).toBe(2)
    expect(salienceTier(rep('DC Councilmember', { jurisdiction: 'Chairman' }), geo)).toBe(2)
  })

  it('puts the federal delegation in tier 2', () => {
    expect(salienceTier(rep('U.S. Senator', { level: 'federal' }), geo)).toBe(2)
    expect(
      salienceTier(rep('Delegate to the U.S. House (non-voting)', { level: 'federal' }), geo)
    ).toBe(2)
  })

  it('leaves state legislators and ANC commissioners as reference (tier 3)', () => {
    expect(salienceTier(rep('State Senator'), geo)).toBe(3)
    expect(
      salienceTier(rep('ANC Commissioner', { level: 'local', jurisdiction: 'SMD 6B02' }), geo)
    ).toBe(3)
  })

  it('handles a location with no resolved ward', () => {
    const noWard: GeoContext = { ...geo, jurisdictions: [] }
    expect(salienceTier(rep('DC Councilmember', { jurisdiction: 'Ward 6' }), noWard)).toBe(2)
  })
})
