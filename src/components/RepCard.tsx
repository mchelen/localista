import { formatDate } from '../lib/format'
import type { Representative } from '../lib/types'

export function RepCard({ rep }: { rep: Representative }) {
  const isIsoDate = rep.nextElection && /^\d{4}-\d{2}-\d{2}$/.test(rep.nextElection)
  return (
    <article className="rep-card">
      {rep.photoUrl && (
        <img
          className="rep-photo"
          src={rep.photoUrl}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <div className="rep-body">
        <h3>{rep.name}</h3>
        <p className="rep-office">
          {rep.office}
          {rep.jurisdiction ? ` · ${rep.jurisdiction}` : ''}
          {rep.party ? ` · ${rep.party}` : ''}
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
              <a href={`tel:${rep.phone}`}>{rep.phone}</a>
            </li>
          )}
          {rep.email && (
            <li>
              <a href={`mailto:${rep.email}`}>{rep.email}</a>
            </li>
          )}
          {rep.website && (
            <li>
              <a href={rep.website} target="_blank" rel="noreferrer">
                Website
              </a>
            </li>
          )}
          {rep.contactForm && (
            <li>
              <a href={rep.contactForm} target="_blank" rel="noreferrer">
                Contact form
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
