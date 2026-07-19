import { pageHref } from '../components/SiteChrome'
export function HelpPage() {
  return (
    <article className="page">
      <h2>Help guide</h2>
      <p>
        Everything you need to use Localista. For the story behind the app and a
        step-by-step visual tour, see the <a href={pageHref('blog/')}>introduction</a>.
      </p>

      <h3>Getting started</h3>
      <p>There are three ways to look up a location, all from the home screen:</p>
      <ul>
        <li>
          <strong>📍 Use my location</strong> — your browser will ask permission to
          share your position. Localista requests it only when you tap the button,
          uses it once to find your districts, and never stores it.
        </li>
        <li>
          <strong>Type an address</strong> — enter any U.S. street address (include
          city and state for best results) and press <em>Look up</em>. Great for
          checking somewhere you’re moving to, or if you’d rather not share your
          location.
        </li>
        <li>
          <strong>Try the demo</strong> — loads bundled sample data for Washington,
          DC. No permission or network needed; useful for a first look.
        </li>
      </ul>

      <h3>Reading the results</h3>
      <ul>
        <li>
          <strong>Where you are</strong> — your “civic address”: every jurisdiction
          containing your location, from country down to (in DC) ward, ANC, and
          Single Member District.
        </li>
        <li>
          <strong>Map</strong> — your location on an OpenStreetMap map with your
          district boundaries outlined (city, congressional district, and — in DC —
          ward and Single Member District by default). Use the legend checkboxes to
          show or hide each boundary, including state, county, and state
          legislative districts.
        </li>
        <li>
          <strong>Your elected representatives</strong> — grouped Federal / State /
          Hyperlocal. Each card shows the office and district, party, current term
          dates, next election for the seat, and contact links (phone, email,
          website, contact form).
        </li>
        <li>
          <strong>Bills &amp; measures</strong> — recent legislative activity in
          Congress and your state legislature (or DC Council), each linking to the
          official bill page.
        </li>
        <li>
          <strong>Upcoming elections</strong> — election dates relevant to your
          state, from official lists when available; at minimum the computed next
          federal general election.
        </li>
        <li>
          <strong>About your jurisdictions</strong> — U.S. Census facts (population,
          median age, income, education, unemployment) for your state, county, and
          city.
        </li>
      </ul>
      <p>
        Every panel names its data source, and the footer shows when the data
        snapshot was compiled.
      </p>

      <h3>Installing Localista as an app</h3>
      <ul>
        <li>
          <strong>iPhone / iPad (Safari):</strong> Share button →{' '}
          <em>Add to Home Screen</em>.
        </li>
        <li>
          <strong>Android (Chrome):</strong> menu ⋮ → <em>Add to Home screen</em> /{' '}
          <em>Install app</em>, or accept the install banner.
        </li>
        <li>
          <strong>Desktop (Chrome/Edge):</strong> the install icon in the address
          bar → <em>Install</em>.
        </li>
      </ul>
      <p>
        Once installed, Localista opens full-screen like a native app and works
        offline: the app itself always loads, and any data you’ve previously fetched
        is shown from cache until you’re back online.
      </p>

      <h3>Troubleshooting</h3>
      <ul>
        <li>
          <strong>“Location permission was denied.”</strong> Use the address box
          instead, or re-enable location for this site in your browser’s site
          settings and try again.
        </li>
        <li>
          <strong>Address not found</strong> — add city and state (e.g. “123 Main
          St, Springfield, IL”). PO Boxes don’t work; the lookup needs a street
          address.
        </li>
        <li>
          <strong>A panel says it couldn’t load</strong> — each section loads
          independently; one unreachable source never blocks the rest. Retry in a
          moment, or check your connection.
        </li>
        <li>
          <strong>State legislators or bills missing</strong> — those come from the
          precompiled data snapshots; on a fresh self-hosted deployment they appear
          after the first data-pipeline run (see the README).
        </li>
        <li>
          <strong>Something looks out of date</strong> — check the snapshot date in
          the footer. Data refreshes daily; officials’ own sites are always the
          authoritative source.
        </li>
      </ul>

      <h3>Privacy in one paragraph</h3>
      <p>
        Localista has no server and no analytics. Your location or typed address is
        sent only to the public geocoding services needed to answer your question
        (U.S. Census Bureau; in DC, the city’s open-data service), then discarded.
        Nothing you look up is recorded by Localista. Full details in{' '}
        <a href={pageHref('about/')}>About</a> and the <a href={pageHref('faq/')}>FAQ</a>.
      </p>
    </article>
  )
}
