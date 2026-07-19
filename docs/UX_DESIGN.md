# Localista — UX & Information Architecture

Status: v0.1 (2026-07-19) — captures product-owner direction on salience,
drill-down, and local services.

## 1. Design principles

1. **Answer the user's real question first.** People don't ask "list every
   jurisdiction I'm in"; they ask *"who actually affects my life here, and
   how do I reach them?"* The interface leads with the most impactful
   officials and services for this location, with the complete reference
   list one step below.
2. **Progressive disclosure.** Start shallow (a card), let the user drill
   down (an administration, an agency, a bill) on demand. Never make the
   first screen pay the cost of the tenth click. Disclosure widgets use
   native semantics (`<details>`) so keyboard/screen-reader behavior is
   free and correct.
3. **Organize by proximity, order by salience.** Grouping follows civic
   proximity (hyperlocal → city → state → federal) because that's the
   user's mental model of "levels"; ordering *within the page* follows
   salience (see §2) because proximity ≠ impact.
4. **Recognition over recall.** Every entity is a self-describing card:
   who, what office, where, term, next election, and actions (call, email,
   website) — no code names, no abbreviations without expansion (ANC is
   always introduced as "Advisory Neighborhood Commission").
5. **Every fact carries provenance and freshness.** Source label per card,
   snapshot date in the footer. Curated data (see §5) is visibly marked.
6. **Mobile-first, action-first.** Contact actions are tap targets
   (`tel:`, `mailto:`), not decorative text. One-column flow, cards sized
   for thumbs.
7. **Graceful degradation is part of the design**, not an error state:
   a missing dataset renders as an explanatory note in place.

## 2. Salience model — "who matters most here?"

Product direction: surface the officials with the most practical impact on
the user's daily life (e.g. in DC: the mayor and the user's ward
councilmember), not just a flat list.

### v1: curated tier heuristic (`src/lib/salience.ts`)

| Tier | Meaning | Examples |
|---|---|---|
| 1 — Key officials | Direct executive power or district-specific legislative power over the user's daily services | Mayor; DC Attorney General; the councilmember for *your* ward; governor |
| 2 — High relevance | Votes on laws that bind the user; citywide seats | U.S. House member/delegate; senators; at-large + chairman councilmembers |
| 3 — Reference | Everyone else the user can elect | State legislators; ANC commissioner (very local, advisory power) |

Tier 1 renders in a highlighted **"Most impactful for you"** section at the
top of results; the grouped complete list follows (deduplicated — key
officials don't repeat below).

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

Product direction: given the user's location, show the civic resources
they most plausibly need (DC → 311 for service requests, DMV for licenses,
DCBOE for voting…).

**"Local services & resources" panel**, populated from a registry:
- **National defaults** (always): USA.gov, vote.gov, congress.gov.
- **Per-jurisdiction curated entries** via the local-provider registry
  (v1: DC — 311, DMV, Board of Elections, DC.gov, DPW collections,
  anc.dc.gov). Each entry: label, one-line "use this when…" description,
  URL, phone where a phone is the natural channel (311).
- Selection principle: the top ~6 tasks residents actually do —
  report/request (311), identity & vehicles (DMV), vote (election board),
  trash/recycling, find law/agency (portal) — not a directory dump.
  A "More…" link points to the jurisdiction's own directory.

Roadmap: state-level registry (50 portals + DMVs + election offices is a
finite curation task well-suited to the pipeline + a community
contribution guide).

## 5. Curation policy

Some high-value facts have no reliable open API (mayor's administration,
service URLs). These live in versioned curated modules
(`src/data/*Curated.ts`) with:
- a `source` label rendered in the UI ("Curated — verify at official site"),
- a `reviewedOn` date surfaced next to the data,
- PR review as the update mechanism; a pipeline validation job (roadmap)
  link-checks curated URLs so rot fails CI visibly.

## 6. Page-level information architecture

```
Header (brand, nav)
└─ Location input (act → results)
   1. Where you are          — orientation: the user's civic address
   2. Most impactful for you — tier-1 officials (salience §2) + drill-downs
   3. Local services         — the "do something now" layer (§4)
   4. All your representatives — complete reference, grouped by proximity
   5. Bills & measures       — what's being decided
   6. Upcoming elections     — when you can act next
   7. About your jurisdictions — context/demographics
```

Rationale for the order: orientation → people with power over you →
things you can get done today → complete civics reference → time-based
actions. Sections 2–3 answer "what should I know/do *now*"; 4–7 reward
deeper engagement. Each panel is independently loadable/failable (NFR-3).
