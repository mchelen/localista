# Localista — Roadmap

## Phase 0 — MVP scaffold (this repo, v0.1) ✅
- Requirements/architecture/data-source docs
- Vite + React + TS PWA, installable, offline shell
- Geolocate + manual address → jurisdictions (Census geocoder)
- Federal reps with term/contact/next-election (congress-legislators)
- DC local provider: ward / ANC / SMD + ANC commissioner
- Demographics for state/county/place (ACS profile)
- Keyed adapters wired: Open States (state reps + bills), Congress.gov
  (federal bills), Google Civic (elections) — graceful no-key fallbacks
- Demo mode with bundled DC sample data
- Unit tests for parsing/date logic

## Phase 0.5 — Static data pipeline ✅ (v0.2)
- `pipeline/` compiles a static data API (`public/data/**`): federal reps,
  state legislators (openstates/people, key-free!), demographics, DC ANC
  commissioners, plus keyed snapshots (bills, elections) via CI secrets
- `.github/workflows/deploy.yml`: push + daily cron → test → pipeline
  (with validation gates) → build → GitHub Pages
- App adapters read static data first with live-API fallbacks; footer
  shows the snapshot date
- E2E test of the static path (Playwright, mocked geocoder/geolocation)
- Consequence: API keys now live only in CI; the old "key-holding proxy
  before launch" item is obsolete

## Phase 1 — Harden the baseline
- First real pipeline run in CI: live-verify every upstream endpoint; fix
  shape drift (see DATA_SOURCES.md checklist); confirm Pages deployment
- Enable GitHub Pages (Settings → Pages → Source: GitHub Actions) and add
  the optional data secrets
- Real PNG icons + richer install experience; Lighthouse PWA pass

## Phase 1.5 — Salience, drill-down, services (v0.3) ✅ first slice
- Curated salience tiers + "Most impactful for you" section (UX_DESIGN §2)
- Official → administration drill-down (v1: DC mayor/AG, curated)
- "Local services & resources" panel (v1: DC + national defaults)
- docs/UX_DESIGN.md: IA principles, salience model, curation policy

## Phase 2 — Depth
- Metric-driven salience in the pipeline (Wikipedia pageviews + GDELT news
  mentions, both keyless — UX_DESIGN.md §2 v2)
- Link-check pipeline job for curated data (URL rot fails CI visibly)
- State-level services registry (portals, DMVs, election offices) +
  contribution guide
- Governor + statewide executives (openstates/people `executive/` dir —
  pipeline already downloads it)
- Bills filtered to *your* legislators' sponsorships; bill search
- Election detail via Google Civic voterInfo (contests, polling places)
- Local news/notices module (jurisdiction RSS registry)

## Phase 3 — Breadth (more hyperlocal providers)
- Provider interface docs + contribution guide
- NYC (community boards, city council districts), SF (supervisor
  districts), Chicago (wards/aldermen), county commissions
- School districts (NCES/Census SCHOOLDISTRICT layers already in geocoder)

## Phase 4 — Engagement (opt-in only)
- Saved locations (local storage first, then optional accounts)
- Push notifications: upcoming election reminders, new bills in your
  districts
- Share cards ("my civic address")

## Open questions for the product owner
1. Should MVP deploy target be GitHub Pages (free, needs base-path config)
   or Cloudflare Pages (free, cleaner URLs + future Workers proxy)?
2. Which keyed sources do you want keys for on day one? (Open States is the
   highest-value: it unlocks state reps AND state bills AND DC Council.)
3. Beyond DC/ANC, which city should get the second local provider?
