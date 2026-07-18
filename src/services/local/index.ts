import type { GeoContext, Jurisdiction, LatLng, Representative } from '../../lib/types'
import { dcProvider } from './dc'

export interface LocalCivicData {
  jurisdictions: Jurisdiction[]
  representatives: Representative[]
}

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
