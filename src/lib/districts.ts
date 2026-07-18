/**
 * District-name normalization shared by the data pipeline (build time) and
 * the app (runtime) so that Census geocoder district names and Open States
 * district names land on the same key.
 *
 * Examples: "State Senate District 21" → "21"; "Ward 6" → "6";
 * "SMD 6B03" → "6b03"; "Chittenden-6-1" → "chittenden 6 1";
 * "Middlesex and Suffolk" → "middlesex and suffolk".
 */
export function normalizeDistrict(raw: string | number | undefined | null): string | undefined {
  if (raw == null) return undefined
  let s = String(raw).toLowerCase()
  s = s.replace(/\(\d{4}\)/g, ' ') // vintage suffixes like "(2022)"
  s = s.replace(
    /\b(state|senate|house|assembly|legislative|district|ward|smd|subdistrict|seat)\b/g,
    ' '
  )
  s = s.replace(/[^a-z0-9]+/g, ' ').trim()
  const tokens = s
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (/^\d+$/.test(t) ? String(Number.parseInt(t, 10)) : t))
  const out = tokens.join(' ')
  return out === '' ? undefined : out
}

/** DC Council seats everyone in DC votes for, regardless of ward. */
export function isAtLargeLike(districtKey: string): boolean {
  return /at large|chairman|chair/.test(districtKey)
}

/**
 * Look up a district map (normalized key → value) with several raw
 * candidate names (e.g. Census BASENAME and full NAME).
 */
export function matchDistrict<T>(
  map: Record<string, T>,
  candidates: Array<string | undefined>
): T | undefined {
  for (const c of candidates) {
    const key = normalizeDistrict(c)
    if (key !== undefined && key in map) return map[key]
  }
  return undefined
}
