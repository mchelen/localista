/** Snapshot DC ANC Single Member District commissioners from DC Open Data. */
import { pickAttribute, pickLayer, type ArcGisLayerRef } from '../src/lib/arcgis'
import { normalizeDistrict } from '../src/lib/districts'
import type { DcLocalFile } from '../src/lib/staticShapes'
import { fetchJson, nowIso, writeJson, type JobResult } from './lib'

const MAPSERVER =
  'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer'
const SOURCE = 'DC Open Data (opendata.dc.gov)'

export async function compileDcLocal(): Promise<JobResult> {
  const root = await fetchJson<{ layers?: ArcGisLayerRef[] }>(`${MAPSERVER}?f=json`)
  const smdLayer = pickLayer(root.layers ?? [], /single member/i)
  if (!smdLayer) throw new Error('validation: SMD layer not found in DC GIS MapServer')

  const query = await fetchJson<{
    features?: Array<{ attributes?: Record<string, unknown> }>
  }>(
    `${MAPSERVER}/${smdLayer.id}/query?where=1%3D1&outFields=*&returnGeometry=false&f=json`
  )

  const file: DcLocalFile = { generatedAt: nowIso(), source: SOURCE, smds: {} }
  for (const feature of query.features ?? []) {
    const attrs = feature.attributes ?? {}
    const smdId = pickAttribute(attrs, [/smd_?id/i, /^name$/i])
    const key = normalizeDistrict(smdId)
    if (!smdId || !key) continue
    file.smds[key] = {
      smdId,
      commissioner: pickAttribute(attrs, [
        /commissioner/i,
        /rep_?name/i,
        /member_?name/i,
        /first_?name/i
      ]),
      email: pickAttribute(attrs, [/email/i]),
      phone: pickAttribute(attrs, [/phone|voice/i])
    }
  }

  const count = Object.keys(file.smds).length
  if (count < 250) {
    throw new Error(`validation: only ${count} DC SMDs (expected ≥ 250)`)
  }
  await writeJson('local/dc.json', file)
  return { status: 'ok', smds: count }
}
