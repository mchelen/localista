/** Compile per-state federal-delegation files from congress-legislators. */
import {
  CONGRESS_ROSTER_SOURCE,
  currentTerm,
  legislatorToRepresentative,
  LEGISLATORS_CURRENT_URL,
  type Legislator
} from '../src/lib/congressRoster'
import type { FederalRepsFile } from '../src/lib/staticShapes'
import { fetchJson, nowIso, writeJson, type JobResult } from './lib'

export async function compileFederal(): Promise<JobResult> {
  const legislators = await fetchJson<Legislator[]>(LEGISLATORS_CURRENT_URL)
  const byState = new Map<string, FederalRepsFile>()
  let members = 0

  for (const person of legislators) {
    const term = currentTerm(person)
    if (!term) continue
    const state = term.state.toLowerCase()
    let file = byState.get(state)
    if (!file) {
      file = {
        generatedAt: nowIso(),
        source: CONGRESS_ROSTER_SOURCE,
        senators: [],
        house: {}
      }
      byState.set(state, file)
    }
    const rep = legislatorToRepresentative(person, term)
    if (term.type === 'sen') file.senators.push(rep)
    else file.house[String(term.district ?? 0)] = rep
    members++
  }

  if (members < 500) {
    throw new Error(`validation: only ${members} members of Congress (expected ≥ 500)`)
  }

  for (const [state, file] of byState) {
    file.senators.sort((a, b) => a.name.localeCompare(b.name))
    await writeJson(`reps/federal/${state}.json`, file)
  }
  return { status: 'ok', states: byState.size, members }
}
