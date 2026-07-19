/**
 * Localista data pipeline: compiles the static data API into public/data/.
 * Run all jobs:            npm run pipeline
 * Run a subset:            npm run pipeline -- --only=federal,dcLocal
 * Fail on any error:       npm run pipeline -- --strict
 *
 * The pipeline is BEST-EFFORT by default: the site (app shell, guide,
 * docs, demo mode) must always build and deploy even when upstream civic
 * APIs are down. A failed dataset:
 *   1. first tries to CARRY FORWARD its last-known-good files from the
 *      previously deployed site (meta.json records each dataset's files),
 *   2. otherwise ships without files — the app falls back to live APIs or
 *      shows an explanatory note for that panel only,
 * and is reported as a GitHub Actions warning annotation, never a failed
 * build. --strict restores exit-code-1 behavior for local debugging.
 */
import type { MetaFile } from '../src/lib/staticShapes'
import { compileFederalBills, compileStateBills } from './bills'
import { compileDcLocal } from './dcLocal'
import { compileDemographics } from './demographics'
import { compileElections } from './elections'
import { compileFederal } from './federal'
import {
  fetchJson,
  filesForDataset,
  nowIso,
  setCurrentDataset,
  writeJson,
  type JobResult
} from './lib'
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

const strict = process.argv.includes('--strict')
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

/** Where the currently deployed data lives (for carry-forward). */
function previousDataBase(): string | undefined {
  if (process.env.PREVIOUS_DATA_URL) {
    return process.env.PREVIOUS_DATA_URL.replace(/\/$/, '')
  }
  const repo = process.env.GITHUB_REPOSITORY // "owner/name" in Actions
  if (repo) {
    const [owner, name] = repo.split('/')
    if (owner && name) return `https://${owner}.github.io/${name}`
  }
  return undefined
}

const meta: MetaFile = { generatedAt: nowIso(), datasets: {} }
const failedJobs: string[] = []

for (const name of selected) {
  const started = Date.now()
  setCurrentDataset(name)
  try {
    const result = await JOBS[name]()
    meta.datasets[name] = { ...result, files: filesForDataset(name) }
    console.log(
      `✓ ${name}: ${JSON.stringify(result)} (${Math.round((Date.now() - started) / 1000)}s)`
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    meta.datasets[name] = { status: 'failed', error: message }
    failedJobs.push(name)
    console.error(`✗ ${name}: ${message}`)
  } finally {
    setCurrentDataset(undefined)
  }
}

// Carry forward last-known-good files for failed datasets from the
// previously deployed site, so transient upstream outages don't degrade
// the deployed data.
if (failedJobs.length > 0 && !strict) {
  const base = previousDataBase()
  let previousMeta: MetaFile | undefined
  if (base) {
    try {
      previousMeta = await fetchJson<MetaFile>(`${base}/data/meta.json`, undefined, 0)
    } catch {
      console.log(`  carry-forward: no previous data found at ${base}/data/`)
    }
  }
  for (const name of failedJobs) {
    const files = previousMeta?.datasets?.[name]?.files
    if (!Array.isArray(files) || files.length === 0) continue
    setCurrentDataset(name)
    let copied = 0
    try {
      for (const rel of files) {
        if (typeof rel !== 'string' || rel.includes('..')) continue
        const data = await fetchJson<unknown>(`${base}/data/${rel}`, undefined, 1)
        await writeJson(rel, data)
        copied++
      }
      if (copied > 0) {
        meta.datasets[name] = {
          ...meta.datasets[name],
          status: 'carried-forward',
          files: filesForDataset(name),
          carriedFrom: previousMeta?.generatedAt
        }
        console.log(`  carry-forward: ${name} restored ${copied} file(s) from previous deploy`)
      }
    } catch (err) {
      console.log(
        `  carry-forward: ${name} failed after ${copied} file(s): ${err instanceof Error ? err.message : err}`
      )
    } finally {
      setCurrentDataset(undefined)
    }
  }
}

await writeJson('meta.json', meta)

for (const name of failedJobs) {
  const entry = meta.datasets[name]
  const note = `dataset '${name}' ${entry.status === 'carried-forward' ? 'failed; previous data carried forward' : 'failed; site ships without it (app falls back to live APIs)'}: ${entry.error}`
  // GitHub Actions warning annotation — visible on the run summary.
  console.log(`::warning title=data pipeline::${note}`)
}

if (strict && failedJobs.length > 0) {
  console.error(`Pipeline FAILED (--strict): ${failedJobs.join(', ')}`)
  process.exit(1)
}
console.log(
  failedJobs.length === 0
    ? 'Pipeline OK'
    : `Pipeline OK with warnings (${failedJobs.join(', ')})`
)
