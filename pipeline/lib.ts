/** Shared utilities for the build-time data pipeline (runs in Node, not the browser). */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const OUT_DIR = path.resolve('public/data')

export function nowIso(): string {
  return new Date().toISOString()
}

export function env(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() !== '' ? v.trim() : undefined
}

export async function writeJson(relPath: string, data: unknown): Promise<void> {
  const file = path.join(OUT_DIR, relPath)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data))
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** Fetch JSON with retries and backoff (handles 429s from rate-limited APIs). */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  retries = 3
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`retryable: HTTP ${res.status}`)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`)
      const text = await res.text()
      try {
        return JSON.parse(text) as T
      } catch {
        // Some APIs answer errors as HTML/text with a 200 — surface a
        // snippet so upstream drift is diagnosable from CI logs.
        throw new Error(
          `non-JSON from ${new URL(url).hostname}: ${text.slice(0, 120).replace(/\s+/g, ' ')}`
        )
      }
    } catch (err) {
      lastError = err
      const retryable =
        err instanceof Error &&
        (err.message.startsWith('retryable') || err.name === 'TypeError')
      if (!retryable || attempt === retries) break
      await sleep(2000 * 2 ** attempt)
    }
  }
  throw lastError
}

export interface JobResult {
  status: 'ok' | 'skipped'
  [key: string]: unknown
}
