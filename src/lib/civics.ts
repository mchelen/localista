/**
 * Pure civic-domain logic: congressional-district code parsing and U.S.
 * general-election date math. Kept free of I/O so it is unit-testable.
 */

/**
 * Normalize a Census congressional-district code to a district number.
 * "08" → 8; "00" (at-large) → 0; "98" (non-voting delegate, e.g. DC) → 0;
 * "99" (no representative, e.g. some territories historically) → 0.
 * Returns undefined for missing/unparseable codes.
 */
export function parseCdCode(code: string | undefined | null): number | undefined {
  if (code == null) return undefined
  const n = Number.parseInt(String(code).trim(), 10)
  if (Number.isNaN(n) || n < 0) return undefined
  if (n >= 98) return 0
  return n
}

/** U.S. general election: first Tuesday after the first Monday in November. */
export function generalElectionDate(year: number): Date {
  const nov1 = new Date(Date.UTC(year, 10, 1))
  const dowNov1 = nov1.getUTCDay() // 0=Sun … 6=Sat
  // First Monday: 1 + ((8 - dow) % 7) with Monday=1
  const firstMonday = 1 + ((8 - dowNov1) % 7)
  return new Date(Date.UTC(year, 10, firstMonday + 1))
}

/** Next even-year federal general election on or after `from`. */
export function nextFederalGeneralElection(from: Date): Date {
  let year = from.getUTCFullYear()
  if (year % 2 !== 0) year += 1
  let d = generalElectionDate(year)
  while (d < from) {
    year += 2
    d = generalElectionDate(year)
  }
  return d
}

/**
 * The regular election for a congressional seat whose current term ends on
 * `termEnd` (ISO date). Terms end in early January; the seat's election is
 * the November general of the preceding year.
 */
export function electionForTermEnd(termEnd: string | undefined): string | undefined {
  if (!termEnd) return undefined
  const year = Number.parseInt(termEnd.slice(0, 4), 10)
  if (Number.isNaN(year)) return undefined
  return isoDate(generalElectionDate(year - 1))
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
