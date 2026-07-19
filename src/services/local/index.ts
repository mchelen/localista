import type {
  CivicResource,
  GeoContext,
  Jurisdiction,
  LatLng,
  Representative
} from '../../lib/types'
import { dcProvider } from './dc'

export interface LocalCivicData {
  jurisdictions: Jurisdiction[]
  representatives: Representative[]
  /** Task-oriented civic services for this place (UX_DESIGN.md §4). */
  resources: CivicResource[]
}

/** Baseline resources shown for any U.S. location. */
export const NATIONAL_RESOURCES: CivicResource[] = [
  {
    label: 'Vote.gov',
    description: 'Register to vote or check your registration, in any state.',
    url: 'https://vote.gov',
    jurisdiction: 'United States'
  },
  {
    label: 'USA.gov',
    description: 'Find any federal service or agency, and state/local government pages.',
    url: 'https://www.usa.gov',
    jurisdiction: 'United States'
  },
  {
    label: 'Congress.gov',
    description: 'Track federal bills and find your members of Congress.',
    url: 'https://www.congress.gov',
    jurisdiction: 'United States'
  }
]

/**
 * A hyperlocal provider adds sub-city jurisdictions and locally elected
 * officials for places it knows about (see ARCHITECTURE.md §5). To support
 * a new city, implement this interface and add it to PROVIDERS.
 */
export interface LocalProvider {
  id: string
  matches(geo: GeoContext): boolean
  fetch(point: LatLng, geo: GeoContext): Promise<LocalCivicData>
}

const PROVIDERS: LocalProvider[] = [dcProvider]

export function findLocalProvider(geo: GeoContext): LocalProvider | undefined {
  return PROVIDERS.find((p) => p.matches(geo))
}
