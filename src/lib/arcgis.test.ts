import { describe, expect, it } from 'vitest'
import { pickAttribute, pickLayer } from './arcgis'

describe('pickLayer', () => {
  const layers = [
    { id: 3, name: 'Ward from 2012' },
    { id: 17, name: 'Ward from 2022' },
    { id: 21, name: 'Advisory Neighborhood Commission from 2023' },
    { id: 8, name: 'Single Member District from 2023' },
    { id: 9, name: 'Zip Codes' }
  ]

  it('prefers the newest "from YYYY" vintage', () => {
    expect(pickLayer(layers, /ward/i)?.id).toBe(17)
  })
  it('matches by pattern regardless of layer id', () => {
    expect(pickLayer(layers, /advisory neighborhood/i)?.id).toBe(21)
    expect(pickLayer(layers, /single member/i)?.id).toBe(8)
  })
  it('returns undefined when nothing matches', () => {
    expect(pickLayer(layers, /school district/i)).toBeUndefined()
  })
})

describe('pickAttribute', () => {
  const attrs = {
    OBJECTID: 12,
    SMD_ID: 'SMD 6B03',
    REP_NAME: 'Jane Q. Commissioner',
    REP_EMAIL: '6B03@anc.dc.gov',
    SHAPE_Length: 0.01
  }

  it('finds string attributes by key pattern in priority order', () => {
    expect(pickAttribute(attrs, [/commissioner/i, /rep_?name/i])).toBe(
      'Jane Q. Commissioner'
    )
    expect(pickAttribute(attrs, [/email/i])).toBe('6B03@anc.dc.gov')
  })
  it('ignores non-string and empty values', () => {
    expect(pickAttribute({ NAME: '', REP: 42 }, [/name/i, /rep/i])).toBeUndefined()
  })
  it('ignores literal "null" strings', () => {
    expect(pickAttribute({ REP_NAME: 'null' }, [/rep_?name/i])).toBeUndefined()
  })
})
