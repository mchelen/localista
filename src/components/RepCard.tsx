import { useState } from 'react'
import { formatDate } from '../lib/format'
import type { Representative } from '../lib/types'

/** "Muriel Bowser" → "MB"; single names keep their first letter. */
export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^\(/.test(w))
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Party → color class. Anything not clearly D/R renders neutral. */
export function partyClass(party?: string): string {
  if (!party) return ''
  if (/democrat/i.test(party)) return 'party-d'
  if (/republican/i.test(party)) return 'party-r'
  return 'party-i'
}

export function RepCard({ rep }: { rep: Representative }) {
  const isIsoDate = rep.nextElection && /^\d{4}-\d{2}-\d{2}$/.test(rep.nextElection)
  const [photoBroken, setPhotoBroken] = useState(false)
  return (
    <article className="rep-card">
      {rep.photoUrl && !photoBroken ? (
        <img
          className="rep-photo"
          src={rep.photoUrl}
          alt=""
          loading="lazy"
          onError={() => setPhotoBroken(true)}
        />
      ) : (
        <span className={`rep-avatar level-${rep.level}`} aria-hidden="true">
          {initials(rep.name)}
        </span>
      )}
      <div className="rep-body">
        <h3>{rep.name}</h3>
        <p className="rep-office">
          {rep.office}
          {rep.jurisdiction ? ` · ${rep.jurisdiction}` : ''}
          {rep.party && (
            <>
              {' '}
              <span className={`party-badge ${partyClass(rep.party)}`}>
                <span className="party-dot" aria-hidden="true" />
                {rep.party}
              </span>
            </>
          )}
        </p>
        {(rep.termStart || rep.termEnd) && (
          <p>
            <strong>Term:</strong> {formatDate(rep.termStart)} – {formatDate(rep.termEnd)}
          </p>
        )}
        {rep.nextElection && (
          <p>
            <strong>Next election:</strong>{' '}
            {isIsoDate ? formatDate(rep.nextElection) : rep.nextElection}
          </p>
        )}
        <ul className="contact-list">
          {rep.phone && (
            <li>
              <a href={`tel:${rep.phone}`}>
                <span aria-hidden="true">☎ </span>
                {rep.phone}
              </a>
            </li>
          )}
          {rep.email && (
            <li>
              <a href={`mailto:${rep.email}`}>
                <span aria-hidden="true">✉ </span>
                {rep.email}
              </a>
            </li>
          )}
          {rep.website && (
            <li>
              <a href={rep.website} target="_blank" rel="noreferrer">
                <span aria-hidden="true">🌐 </span>Website
              </a>
            </li>
          )}
          {rep.contactForm && (
            <li>
              <a href={rep.contactForm} target="_blank" rel="noreferrer">
                <span aria-hidden="true">📝 </span>Contact form
              </a>
            </li>
          )}
        </ul>
        {rep.administration && rep.administration.length > 0 && (
          <details className="admin-details">
            <summary>Administration &amp; key agencies</summary>
            <ul className="admin-list">
              {rep.administration.map((a) => (
                <li key={a.title}>
                  <span className="admin-title">
                    {a.website ? (
                      <a href={a.website} target="_blank" rel="noreferrer">
                        {a.title} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      a.title
                    )}
                  </span>
                  {a.name && <span className="admin-name"> — {a.name}</span>}
                  {a.phone && (
                    <span className="admin-phone">
                      {' '}
                      · <a href={`tel:${a.phone}`}>{a.phone}</a>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
        <p className="source">Source: {rep.source}</p>
      </div>
    </article>
  )
}
