# Localista — Architecture

Status: v0.1 (2026-07-18)

## 1. Overview

Localista MVP is a **client-only single-page app + PWA**. There is no
Localista backend: the browser talks directly to public civic-data APIs.
This keeps hosting free/static, keeps the user's location out of any
Localista-operated server (privacy by architecture), and is viable because
the baseline data sources are keyless and CORS-enabled.

```
┌────────────────────────── Browser (PWA) ──────────────────────────┐
│  UI (React)                                                       │
│   └─ useLocalista() orchestration hook                            │
│        └─ Service layer (one adapter per provider)                │
│             ├─ geocode.ts        Census geocoder (pt → geos)      │
│             ├─ federal.ts        congress-legislators dataset     │
│             ├─ openstates.ts     Open States v3 (keyed)           │
│             ├─ congress.ts       Congress.gov API (keyed)         │
│             ├─ elections.ts      computed + Google Civic (keyed)  │
│             ├─ demographics.ts   Census ACS 5-year profile        │
│             └─ local/dc.ts       DC Open Data (ward/ANC/SMD)      │
│  Service worker (Workbox): app shell precache + runtime caching   │
└───────────────────────────────────────────────────────────────────┘
```

## 2. Stack & rationale

| Choice | Decision | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Ubiquitous, typed domain model matters here |
| Build | Vite | Fast, first-class PWA plugin |
| PWA | vite-plugin-pwa (Workbox) | Precache shell, runtime-cache API data, auto-update |
| Styling | Hand-written CSS (custom properties) | MVP is small; no framework lock-in |
| State | React state in one orchestration hook | No cross-page state; Redux et al. unwarranted |
| Backend | None (MVP) | Baseline sources are keyless+CORS; privacy win |
| Tests | Vitest on pure logic | Parsing/mapping/date math is where bugs live |

## 3. Core data flow

1. **Locate** — `navigator.geolocation` (user gesture) or typed address
   (Census one-line-address geocoder) → `{lat, lng}`.
2. **Resolve jurisdictions** — Census geocoder `geographies/coordinates`
   returns state, county, place, congressional district, and state
   legislative districts (upper/lower) with FIPS codes → normalized
   `GeoContext`.
3. **Fan out** (all in parallel, `Promise.allSettled`; each panel renders
   independently):
   - Federal reps: filter `legislators-current.json` by state + CD.
   - State reps: Open States `people.geo` (if key).
   - Local extras: provider registry keyed by state/place — DC provider
     queries DC Open Data ArcGIS layers (ward, ANC, SMD) by point.
   - Bills: Congress.gov (if key) + Open States bills (if key).
   - Elections: computed federal general + per-seat dates from term ends;
     Google Civic elections list (if key).
   - Demographics: ACS 5-year profile for state, county, place.
4. **Render** — panels show data + per-panel source label + per-panel error
   state ("couldn't reach X — retry").

## 4. Domain model (src/lib/types.ts)

- `GeoContext` — the resolved "where am I": state/county/place with FIPS,
  CD number, SLDU/SLDL, plus an ordered list of `Jurisdiction`s for display.
- `Representative` — level (federal/state/local), office, name, party,
  jurisdiction label, term start/end, contact fields, `nextElection`,
  `source`.
- `Bill` — id, title, jurisdiction, latest action + date, url, source.
- `ElectionInfo` — name, date, jurisdiction, source.
- `JurisdictionDemographics` — jurisdiction name/level + labeled rows +
  source.

All service adapters return these normalized types; the UI never sees a
provider's raw shape. That is the seam that lets providers be swapped
(e.g. replace congress-legislators with Congress.gov members) without UI
changes.

## 5. Provider registry for hyperlocal data

Sub-city bodies are inherently jurisdiction-specific. `src/services/local/`
holds a registry: each provider declares `matches(geo)` and
`fetch(point, geo)` returning jurisdictions + representatives. v1 ships one
provider: **Washington, DC** (ward, ANC, SMD + ANC commissioner from the SMD
attributes). Adding "San Francisco supervisor district" or "NYC community
board" means adding one file that implements the same interface.

The DC provider discovers ArcGIS layer ids at runtime by listing the
MapServer's layers and matching names (`ward`, `advisory neighborhood`,
`single member`), preferring the highest "from YYYY" vintage — DC GIS
renumbers layers between redistricting cycles, so hard-coded layer ids rot.
Attribute names are also discovered defensively (commissioner name/email
fields matched by pattern) for the same reason.

## 6. API keys & the proxy question

Keys are read from Vite env vars (`.env.local`, see `.env.example`):
`VITE_OPENSTATES_API_KEY`, `VITE_CONGRESS_GOV_API_KEY`,
`VITE_GOOGLE_CIVIC_API_KEY`, `VITE_CENSUS_API_KEY` (optional).

Anything in a client bundle is public. For personal use and low-quota free
keys this is acceptable; **before a public production launch**, front the
keyed providers with a thin proxy (Cloudflare Worker / Netlify function)
that holds the keys, enforces rate limits, and pins CORS to the app origin.
The service-layer seam makes this a base-URL change, not a refactor.

## 7. PWA strategy

- **Precache** the app shell (JS/CSS/HTML/icons) — instant, offline-capable
  loads.
- **Runtime caching**:
  - `congress-legislators` roster (~large, changes rarely): CacheFirst,
    1-day TTL.
  - All other civic APIs: NetworkFirst with 10s timeout, 7-day fallback
    cache — fresh when online, last-known-good when offline.
- `registerType: 'autoUpdate'` — new deploys activate on next visit.

## 8. Privacy

- Location is requested only on user gesture, used in-memory, never
  persisted (demo mode exists so the app can be tried with no permission).
- The lat/lng is sent only to: Census geocoder, DC Open Data (DC only), and
  Open States `people.geo` (only if a key is configured). This is disclosed
  in the UI footer.
- No analytics, no cookies, no Localista server.

## 9. Testing & CI

- Vitest unit tests cover the fragile pure logic: congressional-district
  code parsing (incl. at-large `00`/`98`), federal election-date math,
  FIPS→state mapping, ArcGIS attribute discovery, ACS row filtering.
- Network adapters are thin and defensive (every fetch checks `ok`, guards
  shapes, and returns typed errors); integration against live endpoints is
  manual for MVP (see DATA_SOURCES.md verification notes).

## 10. Known constraints / honest caveats

- Google's Civic Information **representatives** endpoint was retired
  (2025); that's why representatives are assembled from
  congress-legislators + Open States + local providers rather than one API.
- Sandbox note: this environment's egress policy blocked the civic-data
  hosts, so endpoint shapes were implemented from documented schemas and
  coded defensively, but not live-verified from CI. First manual run in a
  browser should confirm each panel (see DATA_SOURCES.md checklist).
- "Eligibility to elect" is approximated by district containment; edge
  cases (recent moves, felony-status rules, etc.) are out of scope.
