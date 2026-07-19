import { describe, expect, it } from 'vitest'
import { ACS_VARS, acsRows, pickAcsVariable } from './acs'

// Realistic slice of an ACS profile variables.json.
const VARIABLES = {
  DP05_0001E: { label: 'Estimate!!SEX AND AGE!!Total population' },
  DP05_0001PE: { label: 'Percent!!SEX AND AGE!!Total population' },
  DP05_0021E: { label: 'Estimate!!SEX AND AGE!!Total population!!Median age (years)' },
  DP03_0063E: {
    label:
      'Estimate!!INCOME AND BENEFITS (IN 2023 INFLATION-ADJUSTED DOLLARS)!!Total households!!Median household income (dollars)'
  },
  DP02_0071PE: {
    label:
      "Percent!!EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree or higher"
  },
  DP03_0009PE: {
    label: 'Percent!!EMPLOYMENT STATUS!!Civilian labor force!!Unemployment Rate'
  }
}

const byLabel = (label: string) => ACS_VARS.find((v) => v.label === label)!

describe('pickAcsVariable', () => {
  it('resolves ids by label even when they moved from the static ids', () => {
    expect(pickAcsVariable(VARIABLES, byLabel('Median age'))).toBe('DP05_0021E')
    expect(pickAcsVariable(VARIABLES, byLabel('Median household income'))).toBe(
      'DP03_0063E'
    )
    expect(pickAcsVariable(VARIABLES, byLabel("Bachelor's degree or higher"))).toBe(
      'DP02_0071PE'
    )
  })

  it('respects estimate vs percent suffixes', () => {
    // Population must resolve to the estimate, not the percent twin.
    expect(pickAcsVariable(VARIABLES, byLabel('Population'))).toBe('DP05_0001E')
  })

  it('falls back to the static id when nothing matches', () => {
    expect(pickAcsVariable({}, byLabel('Unemployment rate'))).toBe('DP03_0009PE')
  })
})

describe('acsRows with resolved ids', () => {
  it('reads values through the resolved id mapping and drops sentinels', () => {
    const ids = ['P1', 'P2', 'P3', 'P4', 'P5']
    const header = ['NAME', 'P1', 'P2', 'P3', 'P4', 'P5', 'state']
    const values = ['Maryland', '6180253', '39.1', '-666666666', '43.5', '4.2', '24']
    const rows = acsRows(header, values, ids)
    expect(rows).toEqual([
      { label: 'Population', value: '6,180,253' },
      { label: 'Median age', value: '39.1' },
      { label: "Bachelor's degree or higher", value: '43.5%' },
      { label: 'Unemployment rate', value: '4.2%' }
    ])
  })
})
