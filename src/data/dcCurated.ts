/**
 * Curated Washington, DC civic data with no reliable open-API source:
 * citywide elected executives (with administration drill-down) and the
 * services residents most commonly need. Curation policy —
 * docs/UX_DESIGN.md §5: prefer stable offices + official links over
 * personal names; update via PR; reviewedOn is surfaced in the UI.
 */
import { electionForTermEnd } from '../lib/civics'
import type { CivicResource, Representative } from '../lib/types'

export const DC_CURATED_REVIEWED_ON = '2026-07-19'
const SOURCE = `Curated (reviewed ${DC_CURATED_REVIEWED_ON}) — verify at official site`

export const dcElectedExecutives: Representative[] = [
  {
    level: 'local',
    office: 'Mayor of the District of Columbia',
    name: 'Muriel Bowser',
    party: 'Democrat',
    jurisdiction: 'District of Columbia',
    termEnd: '2027-01-02',
    nextElection: electionForTermEnd('2027-01-02'),
    phone: '202-727-2643',
    website: 'https://mayor.dc.gov',
    email: 'eom@dc.gov',
    source: SOURCE,
    administration: [
      {
        title: 'City Administrator',
        website: 'https://oca.dc.gov',
        phone: '202-478-9200'
      },
      {
        title: 'Deputy Mayor for Operations & Infrastructure',
        website: 'https://dmoi.dc.gov'
      },
      {
        title: 'Department of Transportation (DDOT)',
        website: 'https://ddot.dc.gov',
        phone: '202-673-6813'
      },
      {
        title: 'Department of Public Works (trash, parking enforcement)',
        website: 'https://dpw.dc.gov',
        phone: '202-673-6833'
      },
      {
        title: 'Department of Motor Vehicles (DC DMV)',
        website: 'https://dmv.dc.gov',
        phone: '202-737-4404'
      },
      {
        title: 'Department of Licensing & Consumer Protection',
        website: 'https://dlcp.dc.gov'
      }
    ]
  },
  {
    level: 'local',
    office: 'Attorney General of the District of Columbia',
    name: 'Brian Schwalb',
    party: 'Democrat',
    jurisdiction: 'District of Columbia',
    termEnd: '2027-01-02',
    nextElection: electionForTermEnd('2027-01-02'),
    phone: '202-727-3400',
    website: 'https://oag.dc.gov',
    email: 'oag@dc.gov',
    source: SOURCE,
    administration: [
      { title: 'Consumer Protection (complaints)', website: 'https://oag.dc.gov/consumer-protection' },
      { title: 'Office of Consumer Protection hotline', phone: '202-442-9828' }
    ]
  }
]

export const dcResources: CivicResource[] = [
  {
    label: '311 — city services',
    description:
      'Request or report almost anything: trash pickup, potholes, rodent issues, broken streetlights.',
    url: 'https://311.dc.gov',
    phone: '311',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  },
  {
    label: 'DC DMV',
    description: 'Driver licenses, IDs (REAL ID), vehicle registration, tickets.',
    url: 'https://dmv.dc.gov',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  },
  {
    label: 'DC Board of Elections',
    description: 'Register to vote, find your polling place, request a mail ballot.',
    url: 'https://dcboe.org',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  },
  {
    label: 'DPW collections schedule',
    description: 'Trash, recycling, and bulk-pickup days for your address.',
    url: 'https://dpw.dc.gov/collection',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  },
  {
    label: 'Your ANC',
    description:
      'Meetings and contacts for your Advisory Neighborhood Commission — the most local voice you have.',
    url: 'https://anc.dc.gov',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  },
  {
    label: 'DC.gov',
    description: 'Directory of every DC agency and service.',
    url: 'https://dc.gov',
    jurisdiction: 'Washington, DC',
    source: SOURCE
  }
]
