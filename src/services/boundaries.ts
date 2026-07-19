import { pickLayer, type ArcGisLayerRef } from '../lib/arcgis'
import {
  esriToGeoJson,
  geoidWhere,
  isGeoJsonCollection,
  matchTigerLayers,
  simplifyTolerance,
  TIGER_LAYERS,
  type GeoJsonFeatureCollection
} from '../lib/boundaries'
import type { GeoContext, Jurisdiction, JurisdictionKind, LatLng } from '../lib/types'
import { fetchJson } from './http'

/**
 * Fetches jurisdiction boundary polygons for the map: Census TIGERweb for
 * state/county/place/CD/state-legislative districts (queried by the GEOIDs
 * the geocoder already resolved), DC GIS for ward/ANC/SMD (queried by
 * point intersection). Every boundary is optional — any failure just means
 * that outline is missing from the map.
 */

const TIGERWEB =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer'
const DC_MAPSERVER =
  'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer'

export interface Boundary {
  kind: JurisdictionKind
  label: string
  name: string
  geojson: GeoJsonFeatureCollection
}

const layerCache = new Map<string, Promise<ArcGisLayerRef[]>>()

function listLayers(server: string): Promise<ArcGisLayerRef[]> {
  let cached = layerCache.get(server)
  if (!cached) {
    cached = fetchJson<{ layers?: ArcGisLayerRef[] }>(`${server}?f=json`).then(
      (data) => (data.layers ?? []).map((l) => ({ id: l.id, name: l.name }))
    )
    layerCache.set(server, cached)
    // Don't poison the cache with a transient network failure.
    cached.catch(() => layerCache.delete(server))
  }
  return cached
}

/** Query one ArcGIS layer, tolerating servers that ignore f=geojson. */
async function queryGeoJson(
  server: string,
  layerId: number,
  params: Record<string, string>
): Promise<GeoJsonFeatureCollection> {
  const search = new URLSearchParams({
    outFields: 'GEOID,NAME',
    returnGeometry: 'true',
    outSR: '4326',
    geometryPrecision: '5',
    f: 'geojson',
    ...params
  })
  const data = await fetchJson<unknown>(`${server}/${layerId}/query?${search.toString()}`)
  if (isGeoJsonCollection(data)) return data
  return esriToGeoJson(data as Parameters<typeof esriToGeoJson>[0])
}

async function tigerBoundary(
  j: Jurisdiction,
  layers: ArcGisLayerRef[]
): Promise<Boundary | undefined> {
  if (!j.geoid) return undefined
  for (const layer of matchTigerLayers(layers, j.kind)) {
    const geojson = await queryGeoJson(TIGERWEB, layer.id, {
      where: geoidWhere(j.geoid),
      maxAllowableOffset: String(simplifyTolerance(j.kind))
    })
    if (geojson.features.length > 0) {
      return { kind: j.kind, label: j.label, name: j.name, geojson }
    }
  }
  return undefined
}

const DC_LAYER_PATTERNS: Partial<Record<JurisdictionKind, RegExp>> = {
  ward: /\bwards?\b/i,
  anc: /advisory neighborhood/i,
  smd: /single member/i
}

async function dcBoundary(
  j: Jurisdiction,
  layers: ArcGisLayerRef[],
  point: LatLng
): Promise<Boundary | undefined> {
  const pattern = DC_LAYER_PATTERNS[j.kind]
  const layer = pattern && pickLayer(layers, pattern)
  if (!layer) return undefined
  const geojson = await queryGeoJson(DC_MAPSERVER, layer.id, {
    geometry: `${point.lng},${point.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    maxAllowableOffset: String(simplifyTolerance(j.kind)),
    outFields: '*'
  })
  if (geojson.features.length === 0) return undefined
  return { kind: j.kind, label: j.label, name: j.name, geojson }
}

/** Draw order: largest geographies first so small ones render on top. */
const KIND_ORDER: JurisdictionKind[] = [
  ...TIGER_LAYERS.map((l) => l.kind),
  'ward',
  'anc',
  'smd'
]

export async function getBoundaries(geo: GeoContext): Promise<Boundary[]> {
  const wanted = geo.jurisdictions.filter(
    (j) => (j.geoid && TIGER_LAYERS.some((l) => l.kind === j.kind)) || j.kind in DC_LAYER_PATTERNS
  )
  if (wanted.length === 0) return []

  const results = await Promise.allSettled(
    wanted.map(async (j) => {
      if (j.kind in DC_LAYER_PATTERNS) {
        return dcBoundary(j, await listLayers(DC_MAPSERVER), geo.point)
      }
      return tigerBoundary(j, await listLayers(TIGERWEB))
    })
  )

  const boundaries = results
    .filter(
      (r): r is PromiseFulfilledResult<Boundary> =>
        r.status === 'fulfilled' && r.value !== undefined
    )
    .map((r) => r.value)
  return boundaries.sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  )
}
