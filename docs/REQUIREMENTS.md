# Localista — Requirements

Status: v0.1 (captured 2026-07-18 from product owner)
Owner: Michael Chelen

## 1. Vision

Localista is a website and installable PWA that uses the user's **current
location** to provide **hyperlocal civic information** — who represents you,
what they're working on, when you can next vote, and basic facts about the
places (jurisdictions) you're standing in.

## 2. Product-owner requirements (as stated)

These are the originating requirements, captured verbatim in intent:

1. Use the user's current location to provide hyperlocal information.
2. Show **all current elected representatives the user is eligible to
   elect** — local, state, and federal — including other locally elected
   bodies such as **ANC (Advisory Neighborhood Commission)** commissioners
   in Washington, DC.
3. For each representative, show:
   - their **current term**,
   - their **contact info**,
   - any **upcoming elections** for that seat.
4. Show **current bills or measures under consideration** in the user's
   jurisdictions.
5. Show **useful demographic information about each of the jurisdictions**
   the user is in — e.g. what state, city, ward, and ANC they are in, plus
   facts about those jurisdictions.

## 3. Functional requirements

### FR-1 Location
- FR-1.1 Request browser geolocation on user action (never on page load).
- FR-1.2 Provide a manual fallback: the user can type an address and get the
  same experience (also useful for "look up somewhere else").
- FR-1.3 Resolve a lat/lng into a set of jurisdictions: country, state,
  county, city/place, congressional district, state legislative districts
  (upper/lower), and — where supported — sub-city districts (DC: ward, ANC,
  Single Member District).

### FR-2 Representatives
- FR-2.1 List federal representatives: 2 U.S. Senators + U.S. Representative
  (or non-voting Delegate, e.g. DC).
- FR-2.2 List state representatives: state senator and state house member for
  the user's districts (DC: DC Council, via the same state-level source).
- FR-2.3 List hyperlocal representatives where a provider exists (v1: DC ANC
  commissioner for the user's Single Member District).
- FR-2.4 For each representative show: name, office, party, jurisdiction
  (e.g. "MD-08"), current term start/end, phone, email/contact form, website,
  and the next election for the seat.
- FR-2.5 Every data item shows its source (provenance is a first-class UI
  element).

### FR-3 Bills & measures
- FR-3.1 Show recent federal bills with latest action and a link to the bill.
- FR-3.2 Show recent state bills for the user's state (incl. DC Council).
- FR-3.3 Each bill links out to an authoritative page (congress.gov /
  openstates.org / legislature site).

### FR-4 Elections
- FR-4.1 Show upcoming elections relevant to the user's location.
- FR-4.2 With no API key configured, at minimum show the computed next
  federal general election and per-seat election years derived from term end
  dates.

### FR-5 Jurisdiction demographics
- FR-5.1 For the state, county, and city/place: population, median age,
  median household income, and other useful ACS profile facts.
- FR-5.2 Show the user's full "civic address": state → county → city → ward →
  ANC/SMD (where applicable), with district identifiers.

### FR-8 Salience ("who matters most here")
- FR-8.1 Rank/present representatives by practical impact, not just level
  (e.g. DC: mayor + the user's ward councilmember first). v1: curated tier
  heuristic; v2: metric-driven (news coverage / attention volume — see
  UX_DESIGN.md §2).
- FR-8.2 A highlighted "Most impactful for you" section precedes the
  complete grouped list.

### FR-9 Drill-down
- FR-9.1 An official's card can expand to show the top officials of their
  administration (title, agency website, contact), e.g. mayor → city
  administrator + key agencies. Depth 1; deeper via official sites.
- FR-9.2 Every official/administration entry carries website and contact
  info where available (see FR-2.4).

### FR-10 Local services & resources
- FR-10.1 Show the civic services most relevant to the user's location
  (DC: 311, DMV, Board of Elections, DPW, DC.gov; national defaults
  elsewhere: USA.gov, vote.gov).
- FR-10.2 Entries are task-oriented ("use this when…"), curated per
  jurisdiction via the local-provider registry (curation policy:
  UX_DESIGN.md §5).

### FR-11 UX / information architecture
- FR-11.1 The interface follows the IA and interaction principles in
  docs/UX_DESIGN.md (progressive disclosure, salience-first ordering,
  provenance on every card, native disclosure semantics, mobile-first
  action targets).

### FR-6 PWA
- FR-6.1 Installable (web manifest, icons, standalone display).
- FR-6.2 Works offline for the app shell; previously fetched civic data is
  served from cache when the network is unavailable.
- FR-6.3 Auto-updates when a new version is deployed.

### FR-7 No-key baseline & demo
- FR-7.1 The app must be fully functional for federal + jurisdiction +
  demographics + DC-local data **without any API keys** (using free/open
  endpoints).
- FR-7.2 Keyed sources (Open States, Congress.gov, Google Civic elections)
  enhance the experience when keys are configured, and degrade gracefully
  (an explanatory note, never a broken panel) when absent.
- FR-7.3 A built-in demo mode loads bundled sample data (Washington, DC) so
  the app can be evaluated without granting location or network access.

## 4. Non-functional requirements

- NFR-1 **Privacy**: location is used transiently in the browser; it is sent
  only to the data providers needed to answer the query and is never stored
  server-side by Localista (MVP has no server). No analytics in MVP.
- NFR-2 **Mobile-first**, responsive, dark-mode aware, accessible
  (semantic HTML, labels, focus states).
- NFR-3 **Resilient**: each panel loads and fails independently; one failed
  provider never blanks the page.
- NFR-4 **Static-hostable**: MVP deploys as static files (GitHub Pages,
  Netlify, Cloudflare Pages). HTTPS required (geolocation API requirement).
- NFR-5 **Provenance & freshness**: every panel labels its data source; data
  is fetched live (with caching) rather than baked in, except the demo mode.

## 5. Out of scope for MVP (see ROADMAP.md)

- User accounts, saved addresses, notifications.
- Nationwide coverage of sub-city bodies (school boards, city councils by
  district outside DC) — architecture supports adding providers per place.
- Governors and other statewide executives.
- Polling-place lookup / voter registration status.
- A backend proxy for keyed APIs (recommended before production launch so
  keys are not exposed in the client; see ARCHITECTURE.md §6).
