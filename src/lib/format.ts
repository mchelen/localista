export function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

const ACS_NA_THRESHOLD = -100000 // ACS uses sentinels like -666666666 for N/A

export function acsNumber(raw: string | undefined | null): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  if (Number.isNaN(n) || n <= ACS_NA_THRESHOLD) return undefined
  return n
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

export function formatPercent(n: number): string {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
}
