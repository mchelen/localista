# Localista — Data Sources

Status: v0.1 (2026-07-18)

## Summary table

| Data | Provider | Key? | CORS | Adapter |
|---|---|---|---|---|
| Point → jurisdictions (state, county, place, CD, SLDU/SLDL) | US Census Geocoder | No | Yes | `services/geocode.ts` |
| Address → point | US Census Geocoder (one-line address) | No | Yes | `services/geocode.ts` |
| U.S. Senators / Representative (name, party, term, contact) | `unitedstates/congress-legislators` (GitHub Pages JSON) | No | Yes | `services/federal.ts` |
| State legislators (incl. DC Council) | Open States v3 `people.geo` | **Yes** | Yes | `services/openstates.ts` |
| State bills (incl. DC Council) | Open States v3 `bills` | **Yes** | Yes | `services/openstates.ts` |
| Federal bills (latest actions) | Congress.gov API v3 | **Yes** (free) | Yes | `services/congress.ts` |
| Upcoming elections (official list) | Google Civic Info `elections` | **Yes** | Yes | `services/elections.ts` |
| Upcoming elections (computed baseline) | Derived from term-end dates | No | n/a | `services/elections.ts` |
| Demographics (population, income, age, education, unemployment) | Census ACS 5-year Data Profile | Optional | Yes | `services/demographics.ts` |
| DC ward / ANC / SMD + ANC commissioner | DC Open Data (ArcGIS REST, `maps2.dcgis.dc.gov`) | No | Yes | `services/local/dc.ts` |

Free key signup:
- Open States: https://open.pluralpolicy.com/accounts/profile/ (a.k.a. Plural)
- Congress.gov: https://api.congress.gov/sign-up/
- Google Civic: Google Cloud Console (Civic Information API)
- Census (only needed at high volume): https://api.census.gov/data/key_signup.html

## Endpoint details

### Census Geocoder
- `GET https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x={lng}&y={lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`
- `GET https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address={q}&benchmark=Public_AR_Current&format=json`
- Geography layer names vary by vintage (e.g. "119th Congressional Districts");
  the adapter matches layer names by pattern, not exact string.
- Congressional district code quirks: `00` = at-large; `98` = non-voting
  delegate district (DC); both normalize to district `0`.

### congress-legislators
- `GET https://unitedstates.github.io/congress-legislators/legislators-current.json`
- ~540 members; each has `terms[]` (last one = current) with `start`, `end`,
  `phone`, `url`, `contact_form`, `address`, plus `id.bioguide` for photos:
  `https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg`.
- Senators matched by state; representative matched by state + district
  (at-large/delegate = 0).

### Open States v3 (header `X-API-KEY`)
- `GET https://v3.openstates.org/people.geo?lat={lat}&lng={lng}&include=offices`
- `GET https://v3.openstates.org/bills?jurisdiction={state name}&sort=latest_action_desc&per_page=10`
- Covers all 50 states + DC + PR. DC Council members appear here (DC's
  "state legislature" in Open States).

### Congress.gov API
- `GET https://api.congress.gov/v3/bill?format=json&limit=10&api_key={key}`
  → most-recently-acted-on bills. Bill page URL is constructed from
  congress/type/number.

### Google Civic Information
- `GET https://www.googleapis.com/civicinfo/v2/elections?key={key}`
  filtered client-side by the user's state OCD id + national entries.
- NOTE: the `representatives` endpoint was **retired in April 2025** — do
  not build against it. Elections/voterInfo remain available.

### Census ACS 5-year Data Profile
- `GET https://api.census.gov/data/2023/acs/acs5/profile?get=NAME,{vars}&for=place:{fips}&in=state:{fips}`
  (similarly `for=state:` and `for=county:`).
- Variables used (verify on vintage bump — profile variable ids shift
  between vintages): `DP05_0001E` population, `DP05_0018E` median age,
  `DP03_0062E` median household income, `DP02_0068PE` % bachelor's+,
  `DP03_0009PE` unemployment rate.
- Sentinel negative values (e.g. `-666666666`) mean N/A → row dropped.

### DC Open Data (ArcGIS REST)
- Base: `https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Administrative_Other_Boundaries_WebMercator/MapServer`
- The adapter lists layers (`?f=json`), picks ward / ANC / SMD layers by
  name pattern preferring the newest "from YYYY" vintage, then runs a
  point-in-polygon query (`geometry={lng},{lat}`, `inSR=4326`,
  `outFields=*`). Commissioner name/contact fields on the SMD layer are
  discovered by attribute-name pattern.

## Verification status

⚠️ The development sandbox's egress policy blocked all civic-data hosts
(only package registries allowed), so these endpoints were implemented from
documented schemas + prior knowledge and could not be live-verified in CI.
Adapters are written defensively (shape guards, per-panel error states).

**First-run manual checklist** (open the app in a browser, use a DC address
like "1600 Pennsylvania Ave NW, Washington, DC" and a non-DC address):
- [ ] Geolocate + manual address both resolve jurisdictions
- [ ] Federal reps correct for a known address (senators + rep/delegate)
- [ ] DC: ward, ANC, SMD appear; commissioner name present
- [ ] Demographics rows render for state/county/place
- [ ] With keys configured: state reps, state bills, federal bills,
      elections list populate
- [ ] Without keys: panels show the "add a key" note, not errors
- [ ] Airplane mode after one load: shell + cached data still render
