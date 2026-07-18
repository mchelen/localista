import { describe, expect, it } from 'vitest'
import {
  electionForTermEnd,
  generalElectionDate,
  isoDate,
  nextFederalGeneralElection,
  parseCdCode
} from './civics'

describe('parseCdCode', () => {
  it('parses ordinary districts', () => {
    expect(parseCdCode('08')).toBe(8)
    expect(parseCdCode('1')).toBe(1)
    expect(parseCdCode('53')).toBe(53)
  })
  it('normalizes at-large and delegate codes to 0', () => {
    expect(parseCdCode('00')).toBe(0) // at-large (e.g. WY, VT)
    expect(parseCdCode('98')).toBe(0) // non-voting delegate (DC)
    expect(parseCdCode('99')).toBe(0)
  })
  it('rejects garbage', () => {
    expect(parseCdCode(undefined)).toBeUndefined()
    expect(parseCdCode(null)).toBeUndefined()
    expect(parseCdCode('ZZ')).toBeUndefined()
    expect(parseCdCode('-3')).toBeUndefined()
  })
})

describe('generalElectionDate', () => {
  // Known U.S. general election days.
  it.each([
    [2020, '2020-11-03'],
    [2022, '2022-11-08'],
    [2024, '2024-11-05'],
    [2026, '2026-11-03'],
    [2028, '2028-11-07']
  ])('year %i → %s', (year, expected) => {
    expect(isoDate(generalElectionDate(year))).toBe(expected)
  })
})

describe('nextFederalGeneralElection', () => {
  it('rolls an odd year forward to the next even year', () => {
    expect(isoDate(nextFederalGeneralElection(new Date('2025-06-01T00:00:00Z')))).toBe(
      '2026-11-03'
    )
  })
  it('stays in the current even year before November', () => {
    expect(isoDate(nextFederalGeneralElection(new Date('2026-07-18T00:00:00Z')))).toBe(
      '2026-11-03'
    )
  })
  it('rolls past an already-held election in an even year', () => {
    expect(isoDate(nextFederalGeneralElection(new Date('2026-12-01T00:00:00Z')))).toBe(
      '2028-11-07'
    )
  })
})

describe('electionForTermEnd', () => {
  it('maps a January term end to the prior November general', () => {
    expect(electionForTermEnd('2027-01-03')).toBe('2026-11-03')
    expect(electionForTermEnd('2029-01-03')).toBe('2028-11-07')
  })
  it('handles missing input', () => {
    expect(electionForTermEnd(undefined)).toBeUndefined()
  })
})
