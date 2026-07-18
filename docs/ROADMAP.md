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

## Phase 1 — Harden the baseline
- Live-verify every endpoint from a browser; fix shape drift (see
  DATA_SOURCES.md checklist)
- Real PNG icons + richer install experience; Lighthouse PWA pass
- E2E smoke test (Playwright) with mocked network
- CI (GitHub Actions): typecheck, unit tests, build
- Deploy to static hosting (GitHub Pages or Cloudflare Pages)

## Phase 2 — Depth
- Thin key-holding proxy (Cloudflare Worker) so keys leave the bundle;
  origin-pinned CORS + rate limiting
- Governor + statewide executives (static dataset or Open States people)
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
