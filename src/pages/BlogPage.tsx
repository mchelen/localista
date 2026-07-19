import { pageHref } from '../components/SiteChrome'
import type { ReactNode } from 'react'
import {
  ScreenAddress,
  ScreenBillsElections,
  ScreenDemographics,
  ScreenHome,
  ScreenInstall,
  ScreenPermission,
  ScreenReps,
  ScreenWhereYouAre
} from '../components/demoScreens'
import { PhoneFrame } from '../components/PhoneFrame'

interface DemoStep {
  title: string
  body: ReactNode
  caption: string
  screen: ReactNode
}

const STEPS: DemoStep[] = [
  {
    title: 'Open Localista',
    caption: 'the home screen',
    body: (
      <>
        Open the app in any modern browser. Nothing happens until you act: no
        tracking, no location request on load. You have three ways in — share your
        location, type an address, or load the built-in demo.
      </>
    ),
    screen: <ScreenHome />
  },
  {
    title: 'Share your location (one tap)',
    caption: 'the browser asking permission to share your location',
    body: (
      <>
        Tap <strong>📍 Use my location</strong>. Your browser asks for permission —
        Localista only ever requests it in response to this tap. The coordinates are
        used once, in your browser, to look up your districts, and are never stored.
      </>
    ),
    screen: <ScreenPermission />
  },
  {
    title: '…or type any address',
    caption: 'looking up an address instead of using device location',
    body: (
      <>
        Prefer not to share your location — or curious about somewhere else? Type any
        U.S. street address instead. It’s also handy for checking a place you’re
        moving to.
      </>
    ),
    screen: <ScreenAddress />
  },
  {
    title: 'See where you are, civically',
    caption: 'the “Where you are” panel listing every jurisdiction',
    body: (
      <>
        In a second or two Localista assembles your <em>civic address</em>: state,
        county, city, congressional district, state legislative districts — and in
        Washington, DC, your ward, ANC, and Single Member District.
      </>
    ),
    screen: <ScreenWhereYouAre />
  },
  {
    title: 'Meet your representatives',
    caption: 'representative cards with term, contact info, and next election',
    body: (
      <>
        Every elected official you’re eligible to vote for, grouped by level —
        federal, state, and hyperlocal — each with their current term, phone, email,
        website, and the next election for that seat.
      </>
    ),
    screen: <ScreenReps />
  },
  {
    title: 'Follow bills and elections',
    caption: 'recent bills and the upcoming-elections list',
    body: (
      <>
        Scroll on for what’s moving in Congress and your state legislature (or the DC
        Council), each item linking to the official bill page, plus upcoming election
        dates for your area.
      </>
    ),
    screen: <ScreenBillsElections />
  },
  {
    title: 'Understand your jurisdictions',
    caption: 'demographic facts for state, county, and city',
    body: (
      <>
        Finally, Census facts about each place you’re in — population, median age,
        household income, education, unemployment — for your state, county, and city.
      </>
    ),
    screen: <ScreenDemographics />
  },
  {
    title: 'Install it (optional)',
    caption: 'adding Localista to the home screen as an app',
    body: (
      <>
        Localista is a PWA: use your browser’s <em>Add to Home Screen</em> /{' '}
        <em>Install</em> option and it behaves like a native app — with offline
        support for everything you’ve already looked at.
      </>
    ),
    screen: <ScreenInstall />
  }
]

export function BlogPage() {
  return (
    <article className="page">
      <p className="kicker">From the project</p>
      <h2>Introducing Localista: your neighborhood, explained</h2>
      <p className="byline">The Localista project · 2026</p>

      <p>
        Quick quiz: you can probably name the President. Maybe your governor, and one
        of your U.S. senators. But who represents you on your city or state level —
        and if you live in Washington, DC, who is your ANC commissioner, the elected
        neighbor whose job is literally to represent your few blocks? When is that
        seat next on the ballot? What is your city council actually voting on this
        month?
      </p>
      <p>
        For most of us the honest answer is “no idea” — not from apathy, but because
        the information is scattered across a dozen government sites, each organized
        by agency rather than by <em>you</em>. The paradox of local government is
        that the offices with the most direct effect on daily life are the hardest to
        see.
      </p>

      <h3>What Localista is</h3>
      <p>
        Localista is a free website and installable app that starts from one input —
        where you are — and assembles your complete civic picture: every jurisdiction
        you live in, every representative you’re eligible to elect (federal, state,
        and hyperlocal), their terms, contact details and next elections, current
        bills under consideration, upcoming election dates, and Census facts about
        your state, county, and city. Every item is labeled with its official data
        source.
      </p>

      <h3>Who it’s for</h3>
      <ul>
        <li>
          <strong>Residents</strong> who want to know who speaks for them before
          signing a petition, attending a meeting, or casting a ballot.
        </li>
        <li>
          <strong>New arrivals</strong> — moved recently? One address lookup rebuilds
          your entire civic map.
        </li>
        <li>
          <strong>Organizers and advocates</strong> who need the right office (and
          its phone number) on the first try.
        </li>
        <li>
          <strong>Journalists, researchers, and civics teachers</strong> who need a
          fast, sourced answer to “who represents this address?”
        </li>
      </ul>

      <h3>Why we built it</h3>
      <p>
        Three reasons. First, the gap is real: hyperlocal offices like DC’s Advisory
        Neighborhood Commissions publish their data in GIS systems most people will
        never open. Second, the tools that used to help are disappearing — Google
        retired its Civic Information representatives API in 2025, leaving many
        “find your rep” sites broken. Third, we think the answer should be
        infrastructure, not a product: Localista is open source, keyless to use, and
        built almost entirely on open government data compiled into static files —
        there’s no server watching what you look up, and your location never leaves
        your device except to query public geocoders. (More in{' '}
        <a href={pageHref('about/')}>About</a> and the <a href={pageHref('faq/')}>FAQ</a>.)
      </p>

      <h3>See it in action: a two-minute tour</h3>
      <p>
        Here’s the whole flow, step by step. The screenshots are simulated device
        frames showing the app’s sample data for Washington, DC — you can reproduce
        every step yourself with the <strong>Try the demo</strong> button, no
        location permission needed.
      </p>

      <ol className="demo-steps">
        {STEPS.map((step, i) => (
          <li className="demo-step" key={step.title}>
            <div className="demo-step-text">
              <h4>
                <span className="step-number">{i + 1}</span> {step.title}
              </h4>
              <p>{step.body}</p>
            </div>
            <PhoneFrame caption={step.caption}>{step.screen}</PhoneFrame>
          </li>
        ))}
      </ol>

      <p className="cta">
        That’s it — <a href={pageHref('')}>try it with your own location</a>, or start with the
        demo. If something looks wrong for your area, the <a href={pageHref('faq/')}>FAQ</a>{' '}
        explains how the data works and how to report it.
      </p>
    </article>
  )
}
