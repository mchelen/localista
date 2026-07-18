/**
 * Localista data pipeline: compiles the static data API into public/data/.
 * Run all jobs:            npm run pipeline
 * Run a subset:            npm run pipeline -- --only=federal,dcLocal
 *
 * Keyless jobs always run; keyed jobs (bills, elections) skip cleanly when
 * their env keys are absent. Any hard failure exits non-zero so CI keeps
 * the previous good deployment.
 */
import type { MetaFile } from '../src/lib/staticShapes'
import { compileFederalBills, compileStateBills } from './bills'
import { compileDcLocal } from './dcLocal'
import { compileDemographics } from './demographics'
import { compileElections } from './elections'
import { compileFederal } from './federal'
import { nowIso, writeJson, type JobResult } from './lib'
import { compileStateReps } from './stateReps'

const JOBS: Record<string, () => Promise<JobResult>> = {
  federal: compileFederal,
  stateReps: compileStateReps,
  demographics: compileDemographics,
  dcLocal: compileDcLocal,
  federalBills: compileFederalBills,
  stateBills: compileStateBills,
  elections: compileElections
}

const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const selected = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map((s) => s.trim())
  : Object.keys(JOBS)

const unknown = selected.filter((name) => !(name in JOBS))
if (unknown.length > 0) {
  console.error(`Unknown job(s): ${unknown.join(', ')}. Known: ${Object.keys(JOBS).join(', ')}`)
  process.exit(2)
}

const meta: MetaFile = { generatedAt: nowIso(), datasets: {} }
let failed = false

for (const name of selected) {
  const started = Date.now()
  try {
    const result = await JOBS[name]()
    meta.datasets[name] = { ...result }
    console.log(
      `✓ ${name}: ${JSON.stringify(result)} (${Math.round((Date.now() - started) / 1000)}s)`
    )
  } catch (err) {
    failed = true
    const message = err instanceof Error ? err.message : String(err)
    meta.datasets[name] = { status: 'failed', error: message }
    console.error(`✗ ${name}: ${message}`)
  }
}

await writeJson('meta.json', meta)
console.log(failed ? 'Pipeline FAILED' : 'Pipeline OK')
process.exit(failed ? 1 : 0)
