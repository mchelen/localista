# Localista — Architecture

Status: v0.1 (2026-07-18)

## 1. Overview

Localista is a **client-only single-page app + PWA** fed primarily by a
**precompiled static data API**. There is no Localista backend: a CI
pipeline periodically compiles civic data into JSON files deployed
alongside the app, and the browser reads those (falling back to live
public APIs). This keeps hosting free/static, keeps the user's location
out of any Localista-operated server (privacy by architecture), and keeps
API keys out of the client bundle entirely.

```
┌──────────── CI (GitHub Actions, daily cron) ────────────┐
│  pipeline/  fetches upstream sources (keys = secrets)   │
│    → public/data/**  partitioned JSON  → GitHub Pages   │
└─────────────────────────────────────────────────────────┘
                          │  static hosting (same origin)
┌────────────────────────── Browser (PWA) ──────────────────────────┐
│  UI (React)                                                       │
│   └─ useLocalista() orchestration hook                            │
│        └─ Service layer: static /data/* first, live fallback      │
│             ├─ geocode.ts        Census geocoder (pt → geos) LIVE │
│             ├─ federal.ts        data/reps/federal/{st}.json     │
│             ├─ stateReps.ts      data/reps/state/{st}.json       │
│             ├─ congress.ts       data/bills/us.json              │
│             ├─ openstates.ts     data/bills/{st}.json            │
│             ├─ elections.ts      data/elections.json + computed  │
│             ├─ demographics.ts   data/demographics/{fips}.json   │
│             └─ local/dc.ts       DC GIS point query LIVE          │
│  Service worker (Workbox): shell precache + runtime caching       │
└───────────────────────────────────────────────────────────────────┘
```

Only two things stay live by necessity: the point→district geocoder
lookup and the DC point-in-polygon query — both spatial, per-user, and
keyless. Everything else is shared data compiled ahead of time.

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

## 6. Static data pipeline (pipeline/)

A set of Node jobs (run via `npm run pipeline`, orchestrated by
`.github/workflows/deploy.yml` on push + daily cron) compiles
`public/data/**`:

| File | Contents | Source | Key |
|---|---|---|---|
| `data/reps/federal/{st}.json` | Senators + House by district | congress-legislators | none |
| `data/reps/state/{st}.json` | Legislators by chamber+district | openstates/people repo (YAML tarball) | none |
| `data/demographics/{fips}.json` | State + all counties + all places | Census ACS | optional |
| `data/local/dc.json` | ANC commissioner per SMD | DC Open Data | none |
| `data/bills/us.json`, `data/bills/{st}.json` | Recent-action snapshots | Congress.gov / Open States | CI secrets |
| `data/elections.json` | Upcoming elections | Google Civic | CI secret |
| `data/meta.json` | Run summary + timestamp (shown in app footer) | — | — |

Design points:
- **District keys are normalized** (`src/lib/districts.ts`) so Census
  geocoder names and Open States names collide correctly ("State Senate
  District 21" ≡ "21"; DC "Ward 6" ≡ "6"); values are arrays because some
  states have multi-member districts. The same module runs at build time
  (writer) and runtime (reader).
- **Validation gates**: each job asserts sanity (≥500 members of Congress,
  ≥7000 state legislators, ≥50 states of demographics, ≥250 DC SMDs). A
  failed job fails CI, so the previous good deployment stays live —
  upstream breakage becomes a red workflow, not a broken panel.
- **Keys live only in CI secrets** (`OPENSTATES_API_KEY`,
  `CONGRESS_GOV_API_KEY`, `GOOGLE_CIVIC_API_KEY`, `CENSUS_API_KEY`); keyed
  jobs skip cleanly when unset. The Vite `VITE_*` client-key path still
  exists as a live-API fallback for local development, but is no longer
  needed in production — which removes the old "proxy before launch"
  roadmap item.
- Data files are **not precached** by the service worker (runtime
  NetworkFirst instead), so the daily data refresh doesn't invalidate the
  app-shell precache or force full re-downloads.
- Freshness is bounded by the cron cadence (daily by default; GitHub cron
  can drift by minutes to ~an hour). `meta.json`'s timestamp is surfaced
  in the UI footer as "Data snapshot compiled …".

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
  district-name normalization, Open States YAML→Representative mapping,
  ArcGIS attribute discovery, ACS row filtering.
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
