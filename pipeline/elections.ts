/** Snapshot the Google Civic Information upcoming-elections list. */
import type { ElectionsFile } from '../src/lib/staticShapes'
import { env, fetchJson, nowIso, writeJson, type JobResult } from './lib'

interface CivicElection {
  name?: string
  electionDay?: string
  ocdDivisionId?: string
}

export async function compileElections(): Promise<JobResult> {
  const key = env('GOOGLE_CIVIC_API_KEY')
  if (!key) return { status: 'skipped', reason: 'GOOGLE_CIVIC_API_KEY not set' }

  const data = await fetchJson<{ elections?: CivicElection[] }>(
    `https://www.googleapis.com/civicinfo/v2/elections?key=${key}`
  )
  const file: ElectionsFile = {
    generatedAt: nowIso(),
    source: 'Google Civic Information API',
    elections: (data.elections ?? [])
      .filter((e) => e.name && e.electionDay)
      .map((e) => ({
        name: e.name as string,
        date: e.electionDay as string,
        ocdDivisionId: e.ocdDivisionId
      }))
  }
  await writeJson('elections.json', file)
  return { status: 'ok', elections: file.elections.length }
}
