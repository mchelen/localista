import type { MetaFile } from '../lib/staticShapes'

/**
 * Read a file from the precompiled static data API deployed alongside the
 * app (public/data/**, produced by pipeline/ in CI). Returns undefined when
 * the file isn't there — callers fall back to live APIs — including when a
 * dev server answers a missing path with the SPA's index.html.
 */
export async function fetchStatic<T>(path: string): Promise<T | undefined> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${path}`)
    if (!res.ok) return undefined
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) return undefined
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

export function getDataMeta(): Promise<MetaFile | undefined> {
  return fetchStatic<MetaFile>('data/meta.json')
}
