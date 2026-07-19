# 🏛️ Localista

Hyperlocal civic information as a website + installable PWA. Localista uses
your current location (or a typed address) to show:

- **Where you are** — your full civic address: state, county, city,
  congressional district, state legislative districts, and in DC your ward,
  ANC, and Single Member District.
- **Your elected representatives** — federal, state, and hyperlocal (DC ANC
  commissioners), with current term, contact info, and each seat's next
  election.
- **Bills & measures under consideration** — recent federal and state
  (incl. DC Council) legislative activity.
- **Upcoming elections** for your location.
- **Jurisdiction facts** — population, median age, income, education, and
  unemployment for your state, county, and city (Census ACS).

Privacy: no Localista server, no analytics. Your location is used once in
your browser to query public civic-data APIs, and never stored.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
```

There's also a built-in **demo mode** ("Try the demo") that uses bundled
sample data — no location permission or network needed.

```bash
npm test          # unit tests (Vitest)
npm run build     # production build + PWA (dist/)
npm run preview   # serve the production build
npm run pipeline  # compile the static data API into public/data/
```

## Data: precompiled by CI, no keys in the client

A daily GitHub Actions workflow (`.github/workflows/deploy.yml`) runs
`pipeline/`, which compiles civic data into a **static JSON API**
(`public/data/**`) deployed with the app: federal reps per state, all
~7,400 state legislators (from the open `openstates/people` dataset — no
key), demographics for every state/county/place, DC ANC commissioners,
and — when CI secrets are configured — bill and election snapshots.
Validation gates keep a bad upstream response from replacing good data.

The app reads `/data/` first and falls back to live APIs. Everything works
with **zero API keys**; for local development against live APIs you can
still `cp .env.example .env.local` and add keys.

**One-time repo setup for deployment:**
1. Install the workflow: copy [`docs/ci/deploy.yml`](docs/ci/deploy.yml)
   to `.github/workflows/deploy.yml` and commit. (It lives in `docs/ci/`
   because the automation that authored this branch isn't permitted to
   push workflow files.)
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Add Actions secrets: `CENSUS_API_KEY` (effectively required — shared CI
   runner IPs exceed the Census keyless quota, so the demographics job
   skips without it; free instant signup at
   https://api.census.gov/data/key_signup.html), plus optionally
   `OPENSTATES_API_KEY`, `CONGRESS_GOV_API_KEY`, `GOOGLE_CIVIC_API_KEY`
   for bill/election snapshots.

## Documentation

| Doc | Contents |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Product vision, functional & non-functional requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack decisions, data flow, provider architecture, PWA & privacy design |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Every data source: endpoints, keys, quirks, verification checklist |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan + open questions for the product owner |

## Architecture in one paragraph

Client-only React + TypeScript + Vite PWA — no backend. A CI pipeline
compiles a static JSON data API (federal + state reps, demographics, DC
ANC, bill/election snapshots) deployed with the app on GitHub Pages. In
the browser, a single orchestration hook resolves a point into
jurisdictions (Census geocoder — one of only two calls that stay live),
then fans out to normalized service adapters that read the static data
first and fall back to live APIs. A pluggable **local-provider registry**
handles sub-city bodies (v1: Washington, DC — ward/ANC/SMD point lookup
via DC Open Data, the other live call). Each panel loads, fails, and
caches independently; Workbox precaches the shell and serves
last-known-good data offline.
