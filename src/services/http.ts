/** Fetch JSON with a timeout and a typed failure message. */
export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 15000, ...rest } = init ?? {}
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal })
    if (!res.ok) {
      throw new Error(`${new URL(url).hostname} responded ${res.status}`)
    }
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`${new URL(url).hostname} timed out`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function env(name: string): string | undefined {
  const value = (import.meta.env as Record<string, unknown>)[name]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}
