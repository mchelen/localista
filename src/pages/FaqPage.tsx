import { pageHref } from '../components/SiteChrome'
import type { ReactNode } from 'react'

interface Faq {
  q: string
  a: ReactNode
}

const FAQS: Faq[] = [
  {
    q: 'Is Localista free?',
    a: 'Yes — free, open source, with no ads, accounts, or tracking.'
  },
  {
    q: 'Do you store my location?',
    a: 'No. Your location (or typed address) is used once, inside your browser, to query public geocoding and boundary services, and is never stored. The map is drawn with OpenStreetMap tiles, so the tile servers see the map area you view — never your exact point, which stays in your browser. Localista has no server of its own and no analytics, so there is nothing for us to keep.'
  },
  {
    q: 'Where does the data come from?',
    a: (
      <>
        Official and open sources: the U.S. Census Bureau (districts and
        demographics), the public <code>congress-legislators</code> and Open States
        datasets (federal and state legislators), Congress.gov and Open States (bill
        activity), Google’s Civic Information elections list, and DC Open Data
        (wards, ANCs, commissioners). Every panel is labeled with its source.
      </>
    )
  },
  {
    q: 'How fresh is the data?',
    a: 'Most data is compiled into daily snapshots by an automated pipeline; the footer shows when the current snapshot was built. District lookups happen live. Officials’ own sites remain the authoritative record.'
  },
  {
    q: 'What is an ANC?',
    a: 'In Washington, DC, Advisory Neighborhood Commissions are elected bodies representing neighborhoods of roughly 2,000 residents each; commissioners (unpaid, elected in even years) advise the DC government on everything from liquor licenses to traffic. Your Single Member District (SMD) is the few blocks one commissioner represents — the most local elected office you have.'
  },
  {
    q: 'Why don’t I see ward/ANC-style info for my city?',
    a: 'Sub-city bodies differ in every city, so each needs its own data adapter. Washington, DC is supported first; the architecture accepts new city providers, and contributions are welcome.'
  },
  {
    q: 'Why might my representative be missing or wrong?',
    a: 'Usually one of: the location sits on a district boundary the geocoder resolves differently than expected; a recent special election or resignation hasn’t reached the upstream dataset yet; or a district-name mismatch between sources. The footer snapshot date helps tell staleness from bugs — and bug reports are welcome on GitHub.'
  },
  {
    q: 'Does it work offline?',
    a: 'Yes, as an installed PWA: the app shell always loads, and previously fetched data is served from cache. You need to be online the first time you look up a new location.'
  },
  {
    q: 'Can I look up an address other than where I am?',
    a: 'Yes — type any U.S. street address. Nothing about the lookup is tied to your device’s actual position.'
  },
  {
    q: 'Am I definitely eligible to vote for everyone listed?',
    a: 'Localista shows the officials whose districts contain the location — the standard meaning of “your representatives.” Personal eligibility (registration, citizenship, residency timing) is a separate question; check your election authority.'
  },
  {
    q: 'How can I report a problem or contribute?',
    a: (
      <>
        Open an issue or pull request on the project’s GitHub repository — data
        corrections, new city providers, and translations are all fair game. See{' '}
        <a href={pageHref('about/')}>About</a> for the project’s principles.
      </>
    )
  }
]

export function FaqPage() {
  return (
    <article className="page">
      <h2>Frequently asked questions</h2>
      <div className="faq-list">
        {FAQS.map((f) => (
          <details key={f.q} className="faq">
            <summary>{f.q}</summary>
            <div className="faq-answer">{typeof f.a === 'string' ? <p>{f.a}</p> : f.a}</div>
          </details>
        ))}
      </div>
    </article>
  )
}
