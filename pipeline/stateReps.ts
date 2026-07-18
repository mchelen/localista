/**
 * Compile per-state legislator files from the openstates/people open-data
 * repo (YAML, no API key). Downloaded as one tarball per run.
 */
import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { electionForTermEnd } from '../src/lib/civics'
import { normalizeDistrict } from '../src/lib/districts'
import type { StateRepsFile } from '../src/lib/staticShapes'
import type { Representative } from '../src/lib/types'
import { nowIso, writeJson, type JobResult } from './lib'

const TARBALL_URL = 'https://github.com/openstates/people/archive/refs/heads/main.tar.gz'
const SOURCE = 'Open States people data (github.com/openstates/people)'

type Chamber = 'upper' | 'lower' | 'legislature'

interface OsRole {
  type?: string
  district?: string | number
  jurisdiction?: string
  start_date?: string
  end_date?: string
}

interface OsOffice {
  classification?: string
  address?: string
  voice?: string
}

export interface OsPersonYaml {
  name?: string
  email?: string
  image?: string
  party?: Array<{ name?: string; end_date?: string }>
  roles?: OsRole[]
  offices?: OsOffice[]
  contact_details?: Array<{ note?: string; voice?: string; address?: string; email?: string }>
  links?: Array<{ url?: string; note?: string }>
}

function officeTitle(chamber: Chamber, state: string): string {
  if (state === 'dc') return 'DC Councilmember'
  if (chamber === 'upper') return 'State Senator'
  if (chamber === 'lower') return 'State Representative'
  return 'Legislator'
}

/**
 * Convert one person YAML into a (chamber, districtKey, Representative)
 * entry, or undefined if they hold no current legislative role.
 * Exported for unit testing.
 */
export function personToEntry(
  person: OsPersonYaml,
  state: string,
  today: string
): { chamber: Chamber; districtKey: string; rep: Representative } | undefined {
  const role = [...(person.roles ?? [])]
    .reverse()
    .find(
      (r) =>
        (r.type === 'upper' || r.type === 'lower' || r.type === 'legislature') &&
        (!r.end_date || r.end_date >= today)
    )
  if (!role || !person.name) return undefined
  const districtKey = normalizeDistrict(role.district)
  if (!districtKey) return undefined
  const chamber = role.type as Chamber

  const party =
    person.party?.find((p) => !p.end_date)?.name ?? person.party?.at(-1)?.name
  // "21" → "District 21"; already-descriptive names ("Ward 6", "At-Large",
  // "Middlesex and Suffolk") pass through as-is.
  const districtRaw = String(role.district)
  const jurisdictionLabel = /^\d+[a-z]?$/i.test(districtRaw)
    ? `District ${districtRaw}`
    : districtRaw
  const office = person.offices?.[0] ?? undefined
  const legacyContact = person.contact_details?.[0]
  const website = person.links?.[0]?.url

  return {
    chamber,
    districtKey,
    rep: {
      level: 'state',
      office: officeTitle(chamber, state),
      name: person.name,
      party,
      jurisdiction: jurisdictionLabel,
      termStart: role.start_date,
      termEnd: role.end_date,
      phone: office?.voice ?? legacyContact?.voice,
      address: office?.address ?? legacyContact?.address,
      email: person.email ?? legacyContact?.email,
      website,
      photoUrl: person.image,
      nextElection: role.end_date ? electionForTermEnd(role.end_date) : undefined,
      source: SOURCE
    }
  }
}

async function downloadAndExtract(): Promise<string> {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'openstates-people-'))
  const tarPath = path.join(tmp, 'people.tar.gz')
  const res = await fetch(TARBALL_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading openstates/people`)
  await writeFile(tarPath, Buffer.from(await res.arrayBuffer()))
  execFileSync('tar', ['-xzf', tarPath, '-C', tmp])
  return tmp
}

export async function compileStateReps(): Promise<JobResult> {
  const tmp = await downloadAndExtract()
  try {
    const dataDir = path.join(tmp, 'people-main', 'data')
    const states = await readdir(dataDir)
    const today = nowIso().slice(0, 10)
    let total = 0
    let statesWritten = 0

    for (const state of states) {
      const legDir = path.join(dataDir, state, 'legislature')
      let files: string[]
      try {
        files = await readdir(legDir)
      } catch {
        continue // jurisdiction without a legislature directory
      }

      const file: StateRepsFile = { generatedAt: nowIso(), source: SOURCE, chambers: {} }
      let count = 0
      for (const f of files) {
        if (!f.endsWith('.yml') && !f.endsWith('.yaml')) continue
        let person: OsPersonYaml
        try {
          person = parseYaml(await readFile(path.join(legDir, f), 'utf8')) as OsPersonYaml
        } catch {
          continue // one malformed file must not sink the state
        }
        const entry = personToEntry(person, state, today)
        if (!entry) continue
        const chamber = (file.chambers[entry.chamber] ??= {})
        ;(chamber[entry.districtKey] ??= []).push(entry.rep)
        count++
      }

      if (count > 0) {
        await writeJson(`reps/state/${state}.json`, file)
        statesWritten++
        total += count
      }
    }

    if (total < 7000) {
      throw new Error(
        `validation: only ${total} state legislators nationwide (expected ≥ 7000)`
      )
    }
    return { status: 'ok', states: statesWritten, legislators: total }
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}
