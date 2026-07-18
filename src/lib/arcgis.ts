/**
 * Pure helpers for working with ArcGIS REST responses defensively.
 * DC GIS renumbers layers and renames attributes between redistricting
 * cycles, so nothing here assumes exact ids or field names.
 */

export interface ArcGisLayerRef {
  id: number
  name: string
}

/**
 * Pick the layer whose name matches `pattern`, preferring the newest
 * "from YYYY" vintage when several match (e.g. "Ward from 2012" vs
 * "Ward from 2022").
 */
export function pickLayer(
  layers: ArcGisLayerRef[],
  pattern: RegExp
): ArcGisLayerRef | undefined {
  const matches = layers.filter((l) => pattern.test(l.name))
  if (matches.length === 0) return undefined
  const vintage = (name: string): number => {
    const m = /from\s+(\d{4})/i.exec(name)
    return m ? Number.parseInt(m[1], 10) : 0
  }
  return matches.reduce((best, l) => (vintage(l.name) > vintage(best.name) ? l : best))
}

/**
 * Find the first attribute whose key matches any of `patterns` (in priority
 * order) and whose value is a non-empty string.
 */
export function pickAttribute(
  attributes: Record<string, unknown>,
  patterns: RegExp[]
): string | undefined {
  for (const pattern of patterns) {
    for (const [key, value] of Object.entries(attributes)) {
      if (
        pattern.test(key) &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        value.trim().toLowerCase() !== 'null'
      ) {
        return value.trim()
      }
    }
  }
  return undefined
}
