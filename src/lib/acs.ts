/**
 * Census ACS 5-year Data Profile variables and row parsing, shared by the
 * runtime adapter and the build-time pipeline.
 * Profile variable ids shift between vintages — re-verify on vintage bump.
 */
import { acsNumber, formatCount, formatMoney, formatPercent } from './format'
import type { DemographicRow } from './types'

export const ACS_VINTAGE = '2023'
export const ACS_PROFILE_BASE = `https://api.census.gov/data/${ACS_VINTAGE}/acs/acs5/profile`
export const ACS_SOURCE = `Census ACS 5-year (${ACS_VINTAGE})`

export const ACS_VARS = [
  { id: 'DP05_0001E', label: 'Population', fmt: formatCount },
  {
    id: 'DP05_0018E',
    label: 'Median age',
    fmt: (n: number) => n.toLocaleString('en-US')
  },
  { id: 'DP03_0062E', label: 'Median household income', fmt: formatMoney },
  { id: 'DP02_0068PE', label: "Bachelor's degree or higher", fmt: formatPercent },
  { id: 'DP03_0009PE', label: 'Unemployment rate', fmt: formatPercent }
] as const

export function acsVarList(): string {
  return ACS_VARS.map((v) => v.id).join(',')
}

/** Build display rows from one ACS response row, dropping N/A sentinels. */
export function acsRows(header: string[], values: string[]): DemographicRow[] {
  const byName = new Map(header.map((h, i) => [h, values[i]]))
  const rows: DemographicRow[] = []
  for (const v of ACS_VARS) {
    const n = acsNumber(byName.get(v.id))
    if (n !== undefined) rows.push({ label: v.label, value: v.fmt(n) })
  }
  return rows
}
