/** Compile per-state ACS demographic profiles (state + all counties + all places). */
import {
  ACS_PROFILE_BASE,
  ACS_SOURCE,
  ACS_VARS,
  acsRows,
  pickAcsVariable
} from '../src/lib/acs'
import type { DemographicsFile } from '../src/lib/staticShapes'
import type { JurisdictionDemographics } from '../src/lib/types'
import { STATES_BY_FIPS } from '../src/lib/usStates'
import { env, fetchJson, nowIso, sleep, writeJson, type JobResult } from './lib'

function rowsToProfiles(
  data: string[][],
  level: string,
  keyColumn: string,
  ids: string[]
): Array<{ key: string; profile: JurisdictionDemographics }> {
  if (!Array.isArray(data) || data.length < 2) return []
  const [header, ...rows] = data
  const nameIdx = header.indexOf('NAME')
  const keyIdx = header.indexOf(keyColumn)
  const out: Array<{ key: string; profile: JurisdictionDemographics }> = []
  for (const values of rows) {
    const parsed = acsRows(header, values, ids)
    if (parsed.length === 0) continue
    const key = keyIdx >= 0 ? values[keyIdx] : undefined
    if (!key) continue
    out.push({
      key,
      profile: {
        jurisdictionName: (nameIdx >= 0 ? values[nameIdx] : undefined) ?? level,
        level,
        rows: parsed,
        source: ACS_SOURCE
      }
    })
  }
  return out
}

/**
 * Variable ids drift between ACS vintages, so resolve them from the
 * dataset's own variables.json by label. Falls back to the static ids.
 */
async function resolveVariableIds(): Promise<string[]> {
  try {
    const data = await fetchJson<{ variables?: Record<string, { label?: string }> }>(
      `${ACS_PROFILE_BASE}/variables.json`
    )
    const variables = data.variables ?? {}
    const ids = ACS_VARS.map((v) => pickAcsVariable(variables, v))
    console.log(`  demographics: resolved variables ${ids.join(',')}`)
    return ids
  } catch (err) {
    console.warn(
      `  demographics: variables.json unavailable (${err instanceof Error ? err.message : err}); using static ids`
    )
    return ACS_VARS.map((v) => v.id)
  }
}

export async function compileDemographics(): Promise<JobResult> {
  const key = env('CENSUS_API_KEY')
  const keyParam = key ? `&key=${key}` : ''
  const ids = await resolveVariableIds()
  const get = `get=NAME,${ids.join(',')}`
  let statesWritten = 0
  let failed = 0
  let firstError: string | undefined

  for (const fips of Object.keys(STATES_BY_FIPS)) {
    try {
      const [stateData, countyData, placeData] = [
        await fetchJson<string[][]>(`${ACS_PROFILE_BASE}?${get}&for=state:${fips}${keyParam}`),
        await fetchJson<string[][]>(
          `${ACS_PROFILE_BASE}?${get}&for=county:*&in=state:${fips}${keyParam}`
        ),
        await fetchJson<string[][]>(
          `${ACS_PROFILE_BASE}?${get}&for=place:*&in=state:${fips}${keyParam}`
        )
      ]
      const file: DemographicsFile = {
        generatedAt: nowIso(),
        state: rowsToProfiles(stateData, 'State', 'state', ids)[0]?.profile,
        counties: Object.fromEntries(
          rowsToProfiles(countyData, 'County', 'county', ids).map((p) => [p.key, p.profile])
        ),
        places: Object.fromEntries(
          rowsToProfiles(placeData, 'City / Place', 'place', ids).map((p) => [
            p.key,
            p.profile
          ])
        )
      }
      if (file.state) {
        await writeJson(`demographics/${fips}.json`, file)
        statesWritten++
      }
    } catch (err) {
      // Some territories lack ACS profile coverage — a few failures are
      // expected; the validation gate catches systemic ones.
      failed++
      firstError ??= `state ${fips}: ${err instanceof Error ? err.message : String(err)}`
    }
    await sleep(150)
  }

  if (statesWritten < 50) {
    throw new Error(
      `validation: demographics compiled for only ${statesWritten} states, ${failed} failed (expected ≥ 50). First error — ${firstError ?? 'none recorded'}`
    )
  }
  return { status: 'ok', states: statesWritten, failed, ...(firstError && { firstError }) }
}
