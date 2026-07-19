import { pageHref } from '../components/SiteChrome'
export function AboutPage() {
  return (
    <article className="page">
      <h2>About Localista</h2>
      <p>
        Localista exists to answer one question completely: <em>who represents me,
        right here?</em> It turns your location into your full civic picture — every
        jurisdiction you live in, every official you’re eligible to elect, what
        they’re working on, and when you can next vote — assembled from official
        open data and labeled with its sources.
      </p>

      <h3>Principles</h3>
      <ul>
        <li>
          <strong>Privacy by architecture.</strong> No server, no accounts, no
          analytics. Your location is used transiently in your browser and sent only
          to the public services needed to answer the query. We can’t collect what
          we never receive.
        </li>
        <li>
          <strong>Provenance everywhere.</strong> Civic information demands trust:
          every panel names its data source, and the footer shows when the data
          snapshot was compiled.
        </li>
        <li>
          <strong>Open by default.</strong> Open source code, open government data,
          and a free, keyless baseline experience for everyone.
        </li>
        <li>
          <strong>Hyperlocal first.</strong> The least visible offices — like DC’s
          ANC commissioners — matter most here, because nowhere else surfaces them.
        </li>
        <li>
          <strong>Graceful degradation.</strong> Every section loads and fails
          independently; an unreachable source becomes a note, never a broken page.
        </li>
      </ul>

      <h3>How it works (briefly)</h3>
      <p>
        Localista is a static web app. An automated pipeline compiles open civic
        datasets — Census geographies and demographics, the{' '}
        <code>congress-legislators</code> roster, Open States’ people data,
        Congress.gov and Open States bill activity, election lists, DC Open Data —
        into small JSON files deployed with the app and refreshed daily. Your
        browser does the rest: it resolves your location to districts via the U.S.
        Census geocoder, then reads those precompiled files. Technical readers can
        find full architecture docs in the repository.
      </p>

      <h3>Coverage today</h3>
      <p>
        Federal and state representatives, bills, elections, and demographics cover
        the whole United States. Sub-city coverage starts with Washington, DC
        (wards, ANCs, Single Member Districts, and commissioners); the provider
        architecture is designed for more cities, and contributions are welcome.
      </p>

      <h3>Contact &amp; contributing</h3>
      <p>
        Localista is developed in the open on GitHub — issues and pull requests are
        the best way to report data problems, request features, or add a provider
        for your city. See also the <a href={pageHref('help/')}>help guide</a>, the{' '}
        <a href={pageHref('faq/')}>FAQ</a>, and the <a href={pageHref('blog/')}>introduction post</a>.
      </p>

      <p className="muted">
        Localista is an independent, unofficial project. It is not affiliated with
        any government agency; always confirm time-sensitive details (deadlines,
        polling places) with your election authority.
      </p>
    </article>
  )
}
