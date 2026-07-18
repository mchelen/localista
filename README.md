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

No API keys are required for the baseline experience (federal reps,
jurisdictions, DC local data, demographics, computed elections). To unlock
state legislators, bills, and the official elections list:

```bash
cp .env.example .env.local   # then fill in free keys — see the file
```

There's also a built-in **demo mode** ("Try the demo") that uses bundled
sample data — no location permission or network needed.

```bash
npm test          # unit tests (Vitest)
npm run build     # production build + PWA (dist/)
npm run preview   # serve the production build
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Product vision, functional & non-functional requirements |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack decisions, data flow, provider architecture, PWA & privacy design |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Every data source: endpoints, keys, quirks, verification checklist |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased plan + open questions for the product owner |

## Architecture in one paragraph

Client-only React + TypeScript + Vite PWA — no backend. A single
orchestration hook resolves a point into jurisdictions (Census geocoder),
then fans out in parallel to normalized service adapters:
congress-legislators (federal reps), Open States (state reps + bills,
keyed), Congress.gov (federal bills, keyed), Google Civic (elections,
keyed), Census ACS (demographics), and a pluggable **local-provider
registry** for sub-city bodies (v1: Washington, DC — ward/ANC/SMD via DC
Open Data). Each panel loads, fails, and caches independently; Workbox
precaches the shell and serves last-known-good data offline.
