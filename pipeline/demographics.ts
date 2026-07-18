/** Compile per-state ACS demographic profiles (state + all counties + all places). */
import { ACS_PROFILE_BASE, ACS_SOURCE, acsRows, acsVarList } from '../src/lib/acs'
import type { DemographicsFile } from '../src/lib/staticShapes'
import type { JurisdictionDemographics } from '../src/lib/types'
import { STATES_BY_FIPS } from '../src/lib/usStates'
import { env, fetchJson, nowIso, sleep, writeJson, type JobResult } from './lib'

function rowsToProfiles(
  data: string[][],
  level: string,
  keyColumn: string
): Array<{ key: string; profile: JurisdictionDemographics }> {
  if (!Array.isArray(data) || data.length < 2) return []
  const [header, ...rows] = data
  const nameIdx = header.indexOf('NAME')
  const keyIdx = header.indexOf(keyColumn)
  const out: Array<{ key: string; profile: JurisdictionDemographics }> = []
  for (const values of rows) {
    const parsed = acsRows(header, values)
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

export async function compileDemographics(): Promise<JobResult> {
  const key = env('CENSUS_API_KEY')
  const keyParam = key ? `&key=${key}` : ''
  const get = `get=NAME,${acsVarList()}`
  let statesWritten = 0

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
        state: rowsToProfiles(stateData, 'State', 'state')[0]?.profile,
        counties: Object.fromEntries(
          rowsToProfiles(countyData, 'County', 'county').map((p) => [p.key, p.profile])
        ),
        places: Object.fromEntries(
          rowsToProfiles(placeData, 'City / Place', 'place').map((p) => [p.key, p.profile])
        )
      }
      if (file.state) {
        await writeJson(`demographics/${fips}.json`, file)
        statesWritten++
      }
    } catch {
      // Some territories lack ACS profile coverage — skip them.
    }
    await sleep(150)
  }

  if (statesWritten < 50) {
    throw new Error(
      `validation: demographics compiled for only ${statesWritten} states (expected ≥ 50)`
    )
  }
  return { status: 'ok', states: statesWritten }
}
