import type { JurisdictionKind } from './types'

/**
 * Pure helpers for fetching and drawing jurisdiction boundary polygons.
 * Census TIGERweb and DC GIS are ArcGIS servers whose layer ids and
 * vintage-prefixed names drift over time ("119th Congressional
 * Districts"…), so — as everywhere else in this codebase — layers are
 * discovered by name pattern, never by hard-coded id.
 */

/** Minimal GeoJSON shapes (only what the map needs). */
export interface GeoJsonFeature {
  type: 'Feature'
  properties?: Record<string, unknown> | null
  geometry: { type: string; coordinates: unknown } | null
}
export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

/** TIGERweb layer name patterns per jurisdiction kind. Order = draw order
 * (largest area first, so small districts stay clickable/visible). */
export const TIGER_LAYERS: Array<{ kind: JurisdictionKind; pattern: RegExp }> = [
  { kind: 'state', pattern: /^states$/i },
  { kind: 'county', pattern: /^counties$/i },
  { kind: 'place', pattern: /incorporated places|census designated places/i },
  { kind: 'congressional-district', pattern: /congressional districts?$/i },
  { kind: 'state-upper', pattern: /legislative districts?\s*-?\s*upper/i },
  { kind: 'state-lower', pattern: /legislative districts?\s*-?\s*lower/i }
]

/**
 * Choose the TIGERweb layers to query for one kind. Several may match
 * (e.g. Incorporated Places AND Census Designated Places; a GEOID exists
 * in exactly one, so callers try each until a feature comes back).
 * "… Labels" annotation layers are never polygon sources.
 */
export function matchTigerLayers(
  layers: Array<{ id: number; name: string }>,
  kind: JurisdictionKind
): Array<{ id: number; name: string }> {
  const entry = TIGER_LAYERS.find((l) => l.kind === kind)
  if (!entry) return []
  return layers.filter((l) => entry.pattern.test(l.name) && !/labels/i.test(l.name))
}

/** WHERE clause for a GEOID lookup. GEOIDs are strictly alphanumeric —
 * strip anything else so untrusted input can't break out of the quotes. */
export function geoidWhere(geoid: string): string {
  return `GEOID='${geoid.replace(/[^0-9A-Za-z]/g, '')}'`
}

/**
 * Polygon simplification tolerance (ArcGIS maxAllowableOffset, in degrees
 * ≈ 111km per unit) per kind: big geographies get coarser outlines so a
 * coastal state doesn't weigh megabytes; hyperlocal ones stay crisp.
 */
export function simplifyTolerance(kind: JurisdictionKind): number {
  switch (kind) {
    case 'state':
      return 0.005
    case 'county':
    case 'congressional-district':
      return 0.002
    case 'place':
    case 'state-upper':
    case 'state-lower':
      return 0.0005
    default:
      return 0.0001 // ward / anc / smd — city scale
  }
}

/** Boundaries drawn by default; the rest start unchecked in the legend. */
const DEFAULT_VISIBLE: ReadonlySet<JurisdictionKind> = new Set([
  'place',
  'congressional-district',
  'ward',
  'smd'
])

export function isDefaultVisible(kind: JurisdictionKind): boolean {
  return DEFAULT_VISIBLE.has(kind)
}

/** Distinguishable outline colors (colorblind-safe-ish, dark on light map). */
export const BOUNDARY_COLORS: Partial<Record<JurisdictionKind, string>> = {
  state: '#6b7280',
  county: '#b45309',
  place: '#0e7490',
  'congressional-district': '#1d4ed8',
  'state-upper': '#7c3aed',
  'state-lower': '#be185d',
  ward: '#15803d',
  anc: '#ca8a04',
  smd: '#dc2626'
}

/**
 * Convert an Esri JSON polygon feature set to GeoJSON, for ArcGIS servers
 * that ignore f=geojson. Esri "rings" share GeoJSON's [x, y] coordinate
 * order, so each ring array carries over as a Polygon ring.
 */
export function esriToGeoJson(esri: {
  features?: Array<{
    attributes?: Record<string, unknown>
    geometry?: { rings?: number[][][] }
  }>
}): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = []
  for (const f of esri.features ?? []) {
    const rings = f.geometry?.rings
    if (!rings || rings.length === 0) continue
    features.push({
      type: 'Feature',
      properties: f.attributes ?? {},
      geometry: { type: 'Polygon', coordinates: rings }
    })
  }
  return { type: 'FeatureCollection', features }
}

/** True if a parsed query response already looks like usable GeoJSON. */
export function isGeoJsonCollection(data: unknown): data is GeoJsonFeatureCollection {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === 'FeatureCollection' &&
    Array.isArray((data as { features?: unknown }).features)
  )
}
