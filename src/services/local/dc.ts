import { dcElectedExecutives, dcResources } from '../../data/dcCurated'
import { pickAttribute, pickLayer, type ArcGisLayerRef } from '../../lib/arcgis'
import { normalizeDistrict } from '../../lib/districts'
import type { DcLocalFile } from '../../lib/staticShapes'
import type { Jurisdiction, LatLng, Representative } from '../../lib/types'
import { fetchJson } from '../http'
import { fetchStatic } from '../staticData'
import type { LocalCivicData, LocalProvider } from './index'

const MAPSERVER =
  'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer'
const SOURCE = 'DC Open Data (opendata.dc.gov)'

interface ArcGisQueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>
}

let layerCache: ArcGisLayerRef[] | undefined

async function listLayers(): Promise<ArcGisLayerRef[]> {
  if (!layerCache) {
    const data = await fetchJson<{ layers?: ArcGisLayerRef[] }>(`${MAPSERVER}?f=json`)
    layerCache = (data.layers ?? []).map((l) => ({ id: l.id, name: l.name }))
  }
  return layerCache
}

async function queryPoint(
  layerId: number,
  point: LatLng
): Promise<Record<string, unknown> | undefined> {
  const params = new URLSearchParams({
    geometry: `${point.lng},${point.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json'
  })
  const data = await fetchJson<ArcGisQueryResponse>(
    `${MAPSERVER}/${layerId}/query?${params.toString()}`
  )
  return data.features?.[0]?.attributes
}

const NAME_LIKE = [/^name$/i, /_?name$/i, /^label/i]

async function fetchDc(point: LatLng): Promise<LocalCivicData> {
  const jurisdictions: Jurisdiction[] = []
  // Curated citywide officials and services don't depend on the boundary
  // lookups — a DC GIS outage must not take them down.
  const representatives: Representative[] = [...dcElectedExecutives]

  let ward: Record<string, unknown> | undefined
  let anc: Record<string, unknown> | undefined
  let smd: Record<string, unknown> | undefined
  try {
    const layers = await listLayers()
    const wardLayer = pickLayer(layers, /\bwards?\b/i)
    const ancLayer = pickLayer(layers, /advisory neighborhood/i)
    const smdLayer = pickLayer(layers, /single member/i)
    ;[ward, anc, smd] = await Promise.all([
      wardLayer ? queryPoint(wardLayer.id, point) : Promise.resolve(undefined),
      ancLayer ? queryPoint(ancLayer.id, point) : Promise.resolve(undefined),
      smdLayer ? queryPoint(smdLayer.id, point) : Promise.resolve(undefined)
    ])
  } catch {
    return { jurisdictions, representatives, resources: dcResources }
  }

  if (ward) {
    const name =
      pickAttribute(ward, NAME_LIKE) ?? pickAttribute(ward, [/ward/i])
    if (name) {
      jurisdictions.push({
        kind: 'ward',
        label: 'Ward',
        name: /^ward/i.test(name) ? name : `Ward ${name}`
      })
    }
  }

  if (anc) {
    const name = pickAttribute(anc, [/anc_?id/i, ...NAME_LIKE])
    if (name) {
      jurisdictions.push({
        kind: 'anc',
        label: 'ANC',
        name: /anc/i.test(name) ? name : `ANC ${name}`
      })
    }
  }

  if (smd) {
    const smdId = pickAttribute(smd, [/smd_?id/i, ...NAME_LIKE])
    if (smdId) {
      jurisdictions.push({
        kind: 'smd',
        label: 'ANC Single Member District',
        name: /smd/i.test(smdId) ? smdId : `SMD ${smdId}`
      })
    }
    // Commissioner fields on the SMD layer (names drift between vintages),
    // enriched/backfilled from the precompiled snapshot when available.
    const snapshot = smdId
      ? (await fetchStatic<DcLocalFile>('data/local/dc.json'))?.smds[
          normalizeDistrict(smdId) ?? ''
        ]
      : undefined
    const commissioner =
      pickAttribute(smd, [/commissioner/i, /rep_?name/i, /member_?name/i, /first_?name/i]) ??
      snapshot?.commissioner
    if (commissioner) {
      representatives.push({
        level: 'local',
        office: 'ANC Commissioner',
        name: commissioner,
        jurisdiction: smdId ? (/smd/i.test(smdId) ? smdId : `SMD ${smdId}`) : undefined,
        email: pickAttribute(smd, [/email/i]) ?? snapshot?.email,
        phone: pickAttribute(smd, [/phone|voice/i]) ?? snapshot?.phone,
        website: 'https://anc.dc.gov/',
        nextElection:
          'ANC seats are on the DC general-election ballot in even years',
        source: SOURCE
      })
    }
  }

  return { jurisdictions, representatives, resources: dcResources }
}

export const dcProvider: LocalProvider = {
  id: 'dc',
  matches: (geo) => geo.stateFips === '11' || geo.stateAbbr === 'DC',
  fetch: (point) => fetchDc(point)
}
