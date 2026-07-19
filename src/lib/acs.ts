/**
 * Census ACS 5-year Data Profile variables and row parsing, shared by the
 * runtime adapter and the build-time pipeline.
 *
 * Profile variable ids shift between vintages, so each metric carries a
 * `labelPattern`: the pipeline resolves the real id for the vintage from
 * the dataset's variables.json by label, falling back to the static id.
 */
import { acsNumber, formatCount, formatMoney, formatPercent } from './format'
import type { DemographicRow } from './types'

export const ACS_VINTAGE = '2023'
export const ACS_PROFILE_BASE = `https://api.census.gov/data/${ACS_VINTAGE}/acs/acs5/profile`
export const ACS_SOURCE = `Census ACS 5-year (${ACS_VINTAGE})`

export interface AcsVar {
  /** Best-known id for ACS_VINTAGE; used directly by the app's live
   * fallback and as the pipeline's fallback when label resolution fails. */
  id: string
  label: string
  kind: 'estimate' | 'percent'
  labelPattern: RegExp
  fmt: (n: number) => string
}

export const ACS_VARS: AcsVar[] = [
  {
    id: 'DP05_0001E',
    label: 'Population',
    kind: 'estimate',
    labelPattern: /^Estimate!!SEX AND AGE!!Total population$/i,
    fmt: formatCount
  },
  {
    id: 'DP05_0018E',
    label: 'Median age',
    kind: 'estimate',
    labelPattern: /^Estimate!!SEX AND AGE!!Total population!!Median age \(years\)$/i,
    fmt: (n: number) => n.toLocaleString('en-US')
  },
  {
    id: 'DP03_0062E',
    label: 'Median household income',
    kind: 'estimate',
    labelPattern:
      /^Estimate!!INCOME AND BENEFITS.*!!Total households!!Median household income \(dollars\)$/i,
    fmt: formatMoney
  },
  {
    id: 'DP02_0068PE',
    label: "Bachelor's degree or higher",
    kind: 'percent',
    labelPattern:
      /^Percent!!EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree or higher$/i,
    fmt: formatPercent
  },
  {
    id: 'DP03_0009PE',
    label: 'Unemployment rate',
    kind: 'percent',
    labelPattern:
      /^Percent!!EMPLOYMENT STATUS!!Civilian labor force!!Unemployment Rate$/i,
    fmt: formatPercent
  }
]

export function acsVarList(): string {
  return ACS_VARS.map((v) => v.id).join(',')
}

/**
 * Resolve one metric's variable id for the current vintage by matching
 * labels in the dataset's variables.json map. Ties break to the lowest id;
 * falls back to the static id when nothing matches.
 */
export function pickAcsVariable(
  variables: Record<string, { label?: string }>,
  metric: AcsVar
): string {
  const suffixOk = (id: string) =>
    metric.kind === 'percent' ? id.endsWith('PE') : id.endsWith('E') && !id.endsWith('PE')
  const matches = Object.entries(variables)
    .filter(
      ([id, meta]) =>
        suffixOk(id) &&
        typeof meta.label === 'string' &&
        metric.labelPattern.test(meta.label)
    )
    .map(([id]) => id)
    .sort()
  return matches[0] ?? metric.id
}

/**
 * Build display rows from one ACS response row, dropping N/A sentinels.
 * `ids` must parallel ACS_VARS (defaults to the static ids).
 */
export function acsRows(
  header: string[],
  values: string[],
  ids: string[] = ACS_VARS.map((v) => v.id)
): DemographicRow[] {
  const byName = new Map(header.map((h, i) => [h, values[i]]))
  const rows: DemographicRow[] = []
  ACS_VARS.forEach((v, i) => {
    const n = acsNumber(byName.get(ids[i]))
    if (n !== undefined) rows.push({ label: v.label, value: v.fmt(n) })
  })
  return rows
}
