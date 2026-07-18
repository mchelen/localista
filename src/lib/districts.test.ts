import { describe, expect, it } from 'vitest'
import { isAtLargeLike, matchDistrict, normalizeDistrict } from './districts'

describe('normalizeDistrict', () => {
  it.each([
    ['State Senate District 21', '21'],
    ['State Legislative District 14 (2022)', '14'],
    ['Ward 6', '6'],
    ['6', '6'],
    ['08', '8'],
    ['SMD 6B03', '6b03'],
    ['6B03', '6b03'],
    ['Chittenden-6-1', 'chittenden 6 1'],
    ['Middlesex and Suffolk', 'middlesex and suffolk'],
    ['At-Large', 'at large'],
    ['Chairman', 'chairman']
  ])('%s → %s', (input, expected) => {
    expect(normalizeDistrict(input)).toBe(expected)
  })

  it('handles numbers and empty input', () => {
    expect(normalizeDistrict(8)).toBe('8')
    expect(normalizeDistrict(undefined)).toBeUndefined()
    expect(normalizeDistrict('District')).toBeUndefined()
  })
})

describe('matchDistrict', () => {
  const map = { '21': 'senate-21', '6b03': 'smd' }
  it('matches on the first candidate that normalizes to a key', () => {
    expect(matchDistrict(map, ['State Senate District 21'])).toBe('senate-21')
    expect(matchDistrict(map, [undefined, 'SMD 6B03'])).toBe('smd')
  })
  it('returns undefined when nothing matches', () => {
    expect(matchDistrict(map, ['District 99', undefined])).toBeUndefined()
  })
})

describe('isAtLargeLike', () => {
  it('flags DC at-large and chairman seats', () => {
    expect(isAtLargeLike('at large')).toBe(true)
    expect(isAtLargeLike('chairman')).toBe(true)
    expect(isAtLargeLike('6')).toBe(false)
  })
})
