# Localista — UX & Information Architecture

Status: v0.2 (2026-07-19) — v0.1 captured product-owner direction on
salience, drill-down, and local services; v0.2 adds the **locality-first
information architecture** and the **visual design system**.

## 1. Design principles

1. **Locality first.** Sections are sorted **most local → least local**
   (neighborhood → city → county → state → federal). The more local a
   government is, the more directly it touches daily life — and the less
   likely the user already knows who runs it.
2. **Bundle by level, not by content type.** Product-owner direction
   (2026-07-19): *each level's section shows everything relevant to that
   level together* — its representatives, its services, its bills, its
   next elections, its facts. A user looking at city services sees the
   city's rep beside them, and when that level of government next holds
   an election. (v0.1 grouped by content type — a reps panel, a bills
   panel… — which made users reassemble the picture themselves.)
3. **Progressive disclosure.** Start shallow (a card), let the user drill
   down (an administration, an agency, a bill) on demand. Disclosure
   widgets use native semantics (`<details>`).
4. **Recognition over recall.** Every entity is a self-describing card:
   who, what office, where, term, next election, and actions (call,
   email, website). Icons, tints, and badges (§7) exist to make sections
   and levels recognizable at a glance, never as the sole carrier of
   meaning.
5. **Every fact carries provenance and freshness.** Source label per
   card, snapshot date in the footer. Curated data (§5) is visibly
   marked.
6. **Mobile-first, action-first.** Contact actions are tap targets
   (`tel:`, `mailto:`); one-column flow on phones; desktop widens cards
   into grids rather than adding sidebars.
7. **Graceful degradation is part of the design**, not an error state: a
   missing dataset renders as a note (collected once in "data notes", not
   repeated per section); a level with nothing to show renders no
   section.

## 2. Salience model — "who matters most here?"

Surface the officials with the most practical impact on the user's daily
life. In the locality-first IA (v0.2), salience no longer creates its own
"Most impactful" section — the page order already puts the most local
(and usually most overlooked) governments on top. Instead, salience
**orders the cards within each level's section** (`bySalience`), so the
mayor leads the city section and the user's own ward councilmember
outranks at-large members.

### v1: curated tier heuristic (`src/lib/salience.ts`)

| Tier | Meaning | Examples |
|---|---|---|
| 1 — Key officials | Direct executive power or district-specific legislative power over the user's daily services | Mayor; DC Attorney General; the councilmember for *your* ward; governor |
| 2 — High relevance | Votes on laws that bind the user; citywide seats | U.S. House member/delegate; senators; at-large + chairman councilmembers |
| 3 — Reference | Everyone else the user can elect | State legislators; ANC commissioner (very local, advisory power) |

### v2 (roadmap): metric-driven salience

Replace/augment the heuristic with observable attention metrics, computed
in the data pipeline (keyless sources exist):

- **Wikipedia pageviews API** (keyless, CORS): monthly views for each
  official's article ≈ public attention.
- **GDELT 2.0 API** (keyless): news-mention counts for name+office queries
  ≈ media coverage.
- Blend: `salience = w1·log(pageviews) + w2·log(news_mentions) + tier_prior`.
  Computed daily per official in `pipeline/`, shipped in the reps files,
  used to order cards. The tier prior prevents a scandal-driven ANC
  commissioner from outranking the mayor's structural importance.

## 3. Drill-down: from an official to their administration

Product direction: clicking the mayor should reveal the top officials of
that administration.

Pattern: an official's card may carry an `administration` list (title,
name when confidently known, agency website, phone). It renders as a
`<details>` disclosure — "Administration & key agencies" — inside the
card. This generalizes: a governor card can carry cabinet members, a
council chairman can carry committee chairs (roadmap).

Rules:
- Depth limit 1 on the card itself; deeper exploration goes to the
  official agency site (external links marked).
- Prefer *offices with links* over *names*: agency heads churn faster than
  our curation cadence; a stale link is worse than a missing name. Include
  names only for elected or highly stable roles.

## 4. Local services & resources

Given the user's location, show the civic resources they most plausibly
need — **inside the level section they belong to** (311/DMV in the city
section, vote.gov/USA.gov in the federal section, "Your ANC" in the
neighborhood section).

Registry as before:
- **National defaults** (always): USA.gov, vote.gov, congress.gov.
- **Per-jurisdiction curated entries** via the local-provider registry
  (v1: DC — 311, DMV, Board of Elections, DC.gov, DPW collections,
  anc.dc.gov). Each entry: label, one-line "use this when…" description,
  URL, phone where a phone is the natural channel (311).
- Selection principle: the top ~6 tasks residents actually do, not a
  directory dump. A "More…" link points to the jurisdiction's own
  directory.

Roadmap: state-level registry (50 portals + DMVs + election offices).

## 5. Curation policy

Some high-value facts have no reliable open API (mayor's administration,
service URLs). These live in versioned curated modules
(`src/data/*Curated.ts`) with:
- a `source` label rendered in the UI ("Curated — verify at official site"),
- a `reviewedOn` date surfaced next to the data,
- PR review as the update mechanism; a pipeline validation job (roadmap)
  link-checks curated URLs so rot fails CI visibly.

## 6. Page-level information architecture (v0.2, locality-first)

```
Sticky header (logo, wordmark, site nav)
└─ Location input (act → results)
   Jump nav — one tinted chip per section below (anchor links)
   0. Where you are   📍  orientation: the full civic address
   1. Map             🗺️  orientation: the point + district boundaries
   2. Your neighborhood 🏘️  (when resolved, e.g. DC ANC/SMD)
   3. Your city         🏙️
   4. Your county       🏞️  (when it has data; often facts only)
   5. Your state        🏛️
   6. Federal           🇺🇸
   Data notes — unavailable/error datasets, reported once
```

Each level section contains, in order, whichever of these have content:

```
District chips   — the user's districts at this level (Ward 6, ANC 6B…)
👥 Representatives    — cards, salience-ordered (§2)
🧰 Services & resources
📜 Bills & measures
🗳️ Next elections     — when this level of government votes next
📊 Facts & figures    — ACS demographics for this jurisdiction
```

Classification lives in `src/lib/civicLevels.ts` (pure, unit-tested).
Special cases, encoded there:
- **DC**: the District's government holds city + state (+ the vestigial
  county) powers, so state- and county-classified data folds into the
  city section, subtitled to explain why.
- Congressional districts belong to the **federal** section (they elect
  federal representation), even though they're drawn within a state.
- Levels the geocoder didn't resolve (no ANC outside DC) or with nothing
  to show render no section, and no jump chip.

Rationale: orientation first, then power ordered by proximity to the
user's front door. Within a level, order runs people → tasks → decisions
→ timing → context. Every dataset is still independently loadable and
failable (NFR-3); failures collect in one "data notes" strip instead of
littering every section.

## 7. Visual design system

Goal: graphics carry wayfinding. Users should be able to answer "what am
I looking at, and what level of government is this?" from shape and color
before reading a word.

- **Design tokens** (`src/styles.css` `:root`): surfaces, text, borders,
  radii, shadows — each with a dark-mode value under
  `prefers-color-scheme` (the whole system is theme-aware).
- **Section identity**: every section has an emoji glyph in a tinted
  rounded chip + a tint color (`SECTIONS` in `src/lib/sections.ts`). The
  same glyph + tint appear in the section header and its jump chip, so
  the chip row doubles as a legend for the page.
- **Jump nav**: tinted anchor chips after location resolution — the page
  map for a long scroll; horizontally scrollable on phones; sections use
  `scroll-margin-top` so the sticky header never covers a target.
- **Category glyphs** (`CATEGORY`): 👥 reps, 🧰 services, 📜 bills, 🗳️
  elections, 📊 facts — repeated identically in *every* level section so
  the sub-structure is learn-once.
- **Level color coding**: representative avatars (initials, used whenever
  no photo exists) are tinted by government level (federal indigo, state
  violet, local green) — a second, redundant cue for level.
- **Party affiliation**: a small dot-badge (D blue, R red, other
  neutral) — color plus text, never color alone.
- **Brand**: the pin-over-columns logo (`public/icons/localista.svg`)
  anchors the sticky header; the same mark is the PWA icon and favicon,
  so the installed app and the tab are recognizably the same thing.
- **Responsive rules**: one column on phones (cards full-width, chip rows
  scroll horizontally, location controls form a 2×2 grid); on desktop the
  container widens to 64rem and card collections become `auto-fill`
  grids (reps ≥17rem, resources ≥15rem, facts ≥16rem); the map grows
  from 300px to 420px tall. No sidebars — reading order is identical at
  every width.
- **Motion**: none beyond hover/focus transitions and smooth anchor
  scrolling; `focus-visible` outlines everywhere.
