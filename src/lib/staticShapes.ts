/**
 * File formats of the precompiled static data API (public/data/**), shared
 * by the pipeline (writer) and the app's service adapters (readers).
 * See docs/ARCHITECTURE.md — "Static data pipeline".
 */
import type { Bill, JurisdictionDemographics, Representative } from './types'

/** data/reps/federal/{state}.json — state = lowercase USPS abbr */
export interface FederalRepsFile {
  generatedAt: string
  source: string
  senators: Representative[]
  /** Key: district number as string ("0" = at-large/delegate). */
  house: Record<string, Representative>
}

/** data/reps/state/{state}.json */
export interface StateRepsFile {
  generatedAt: string
  source: string
  /**
   * Chamber → normalized district key (lib/districts.ts) → members
   * (arrays: several states have multi-member districts). DC Council and
   * Nebraska's unicameral body land under "legislature"/"upper".
   */
  chambers: Partial<
    Record<'upper' | 'lower' | 'legislature', Record<string, Representative[]>>
  >
}

/** data/bills/us.json and data/bills/{state}.json */
export interface BillsFile {
  generatedAt: string
  bills: Bill[]
}

/** data/elections.json — raw entries; the app filters by state. */
export interface ElectionsFile {
  generatedAt: string
  source: string
  elections: Array<{ name: string; date: string; ocdDivisionId?: string }>
}

/** data/demographics/{stateFips}.json — keys are county / place FIPS. */
export interface DemographicsFile {
  generatedAt: string
  state?: JurisdictionDemographics
  counties: Record<string, JurisdictionDemographics>
  places: Record<string, JurisdictionDemographics>
}

/** data/local/dc.json — keyed by normalized SMD id (e.g. "6b03"). */
export interface DcLocalFile {
  generatedAt: string
  source: string
  smds: Record<
    string,
    { smdId: string; commissioner?: string; email?: string; phone?: string }
  >
}

/** data/meta.json — pipeline run summary, surfaced in the app footer. */
export interface MetaFile {
  generatedAt: string
  datasets: Record<string, Record<string, unknown> & { status: string }>
}
