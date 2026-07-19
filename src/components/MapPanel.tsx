import { useCallback, useEffect, useRef, useState } from 'react'
import type * as LeafletNs from 'leaflet'
import { BOUNDARY_COLORS, isDefaultVisible } from '../lib/boundaries'
import type { GeoContext, JurisdictionKind } from '../lib/types'
import { getBoundaries, type Boundary } from '../services/boundaries'

type LeafletModule = typeof LeafletNs

/**
 * Map of the resolved location: OpenStreetMap tiles, a marker at the
 * point, and toggleable jurisdiction boundary outlines. Leaflet and the
 * boundary polygons load lazily — the map is progressive enhancement and
 * must never block or break the panels (demo mode may be fully offline:
 * then the marker simply sits on an empty canvas).
 */

let leafletPromise: Promise<LeafletModule> | undefined

function loadLeaflet(): Promise<LeafletModule> {
  leafletPromise ??= Promise.all([
    import('leaflet'),
    // Vite turns this into a lazy-loaded stylesheet.
    import('leaflet/dist/leaflet.css')
  ]).then(([mod]) => (mod as { default?: LeafletModule }).default ?? (mod as LeafletModule))
  return leafletPromise
}

export function MapPanel({ geo }: { geo: GeoContext }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef(new Map<JurisdictionKind, LeafletNs.GeoJSON>())
  const fittedRef = useRef(false)
  const [map, setMap] = useState<LeafletNs.Map>()
  const [leaflet, setLeaflet] = useState<LeafletModule>()
  const [boundaries, setBoundaries] = useState<Boundary[]>([])
  const [visible, setVisible] = useState<ReadonlySet<JurisdictionKind>>(new Set())

  // Create the map (and tear it down) per resolved location.
  useEffect(() => {
    let cancelled = false
    let created: LeafletNs.Map | undefined
    void loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return
      created = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [geo.point.lat, geo.point.lng],
        13
      )
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(created)
      L.circleMarker([geo.point.lat, geo.point.lng], {
        radius: 7,
        color: '#1d4ed8',
        weight: 3,
        fillColor: '#60a5fa',
        fillOpacity: 0.9
      })
        .addTo(created)
        .bindPopup(geo.matchedAddress ?? 'Your location')
      setLeaflet(L)
      setMap(created)
    })
    return () => {
      cancelled = true
      layersRef.current.clear()
      fittedRef.current = false
      created?.remove()
      setMap(undefined)
    }
  }, [geo])

  // Fetch boundary polygons for this location; failures = no outlines.
  useEffect(() => {
    let cancelled = false
    setBoundaries([])
    getBoundaries(geo)
      .then((found) => {
        if (cancelled) return
        setBoundaries(found)
        setVisible(new Set(found.filter((b) => isDefaultVisible(b.kind)).map((b) => b.kind)))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [geo])

  // Sync boundary layers with the visibility toggles.
  useEffect(() => {
    if (!map || !leaflet) return
    const layers = layersRef.current
    for (const b of boundaries) {
      let layer = layers.get(b.kind)
      if (!layer) {
        const color = BOUNDARY_COLORS[b.kind] ?? '#334155'
        layer = leaflet
          .geoJSON(b.geojson as never, {
            style: { color, weight: 2, fillColor: color, fillOpacity: 0.06 }
          })
          .bindTooltip(`${b.label}: ${b.name}`, { sticky: true })
        layers.set(b.kind, layer)
      }
      if (visible.has(b.kind)) layer.addTo(map)
      else layer.remove()
    }
    // Frame the smallest visible boundary (drawn last = most local) once
    // per location — not on every toggle, which would fight the user.
    const shown = boundaries.filter((b) => visible.has(b.kind))
    const focus = shown.length > 0 ? layers.get(shown[shown.length - 1].kind) : undefined
    if (focus && !fittedRef.current) {
      const bounds = focus.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.08))
        fittedRef.current = true
      }
    }
  }, [map, leaflet, boundaries, visible])

  const toggle = useCallback((kind: JurisdictionKind) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }, [])

  return (
    <section className="panel">
      <h2>Map</h2>
      <div ref={containerRef} className="map-canvas" role="application" aria-label="Map of your location and district boundaries" />
      {boundaries.length > 0 && (
        <fieldset className="map-legend">
          <legend className="visually-hidden">Boundary layers</legend>
          {boundaries.map((b) => (
            <label className="map-legend-item" key={b.kind}>
              <input
                type="checkbox"
                checked={visible.has(b.kind)}
                onChange={() => toggle(b.kind)}
              />
              <span
                className="map-legend-swatch"
                style={{ background: BOUNDARY_COLORS[b.kind] ?? '#334155' }}
                aria-hidden="true"
              />
              {b.label}
            </label>
          ))}
        </fieldset>
      )}
      <p className="source">
        Map: © OpenStreetMap contributors · Boundaries: U.S. Census Bureau TIGERweb
        {geo.stateAbbr === 'DC' ? ' + DC Open Data' : ''}. Tile servers see only the
        map area you view, never your exact point.
      </p>
    </section>
  )
}
