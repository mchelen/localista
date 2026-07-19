import { describe, expect, it } from 'vitest'
import {
  esriToGeoJson,
  geoidWhere,
  isGeoJsonCollection,
  matchTigerLayers,
  simplifyTolerance
} from './boundaries'

// Realistic TIGERweb layer listing: vintage-prefixed names plus the
// annotation ("Labels") layers that must never be picked as polygon
// sources.
const TIGER_LISTING = [
  { id: 0, name: '119th Congressional Districts Labels' },
  { id: 1, name: '119th Congressional Districts' },
  { id: 2, name: 'States Labels' },
  { id: 3, name: 'States' },
  { id: 4, name: 'Counties Labels' },
  { id: 5, name: 'Counties' },
  { id: 6, name: 'County Subdivisions' },
  { id: 7, name: 'Incorporated Places' },
  { id: 8, name: 'Census Designated Places' },
  { id: 9, name: '2024 State Legislative Districts - Upper' },
  { id: 10, name: '2024 State Legislative Districts - Lower' }
]

describe('matchTigerLayers', () => {
  it('finds vintage-prefixed layers and skips label layers', () => {
    expect(matchTigerLayers(TIGER_LISTING, 'congressional-district')).toEqual([
      { id: 1, name: '119th Congressional Districts' }
    ])
  })

  it('matches states/counties exactly, not county subdivisions', () => {
    expect(matchTigerLayers(TIGER_LISTING, 'state').map((l) => l.id)).toEqual([3])
    expect(matchTigerLayers(TIGER_LISTING, 'county').map((l) => l.id)).toEqual([5])
  })

  it('returns both place layers so callers can try each', () => {
    expect(matchTigerLayers(TIGER_LISTING, 'place').map((l) => l.id)).toEqual([7, 8])
  })

  it('distinguishes upper and lower legislative chambers', () => {
    expect(matchTigerLayers(TIGER_LISTING, 'state-upper').map((l) => l.id)).toEqual([9])
    expect(matchTigerLayers(TIGER_LISTING, 'state-lower').map((l) => l.id)).toEqual([10])
  })

  it('returns nothing for kinds TIGERweb does not serve', () => {
    expect(matchTigerLayers(TIGER_LISTING, 'ward')).toEqual([])
  })
})

describe('geoidWhere', () => {
  it('builds a quoted GEOID clause', () => {
    expect(geoidWhere('11001')).toBe("GEOID='11001'")
  })

  it('strips anything that could escape the quotes', () => {
    expect(geoidWhere("11' OR 1=1 --")).toBe("GEOID='11OR11'")
  })
})

describe('simplifyTolerance', () => {
  it('is coarser for bigger geographies', () => {
    expect(simplifyTolerance('state')).toBeGreaterThan(simplifyTolerance('county'))
    expect(simplifyTolerance('county')).toBeGreaterThan(simplifyTolerance('place'))
    expect(simplifyTolerance('place')).toBeGreaterThan(simplifyTolerance('smd'))
  })
})

describe('esriToGeoJson', () => {
  it('converts polygon rings and keeps attributes', () => {
    const out = esriToGeoJson({
      features: [
        {
          attributes: { GEOID: '11001', NAME: 'District of Columbia' },
          geometry: {
            rings: [
              [
                [-77.1, 38.8],
                [-76.9, 38.8],
                [-77.0, 39.0],
                [-77.1, 38.8]
              ]
            ]
          }
        }
      ]
    })
    expect(out.type).toBe('FeatureCollection')
    expect(out.features).toHaveLength(1)
    expect(out.features[0].properties).toMatchObject({ GEOID: '11001' })
    expect(out.features[0].geometry).toMatchObject({ type: 'Polygon' })
    expect(isGeoJsonCollection(out)).toBe(true)
  })

  it('drops features without geometry and tolerates empty input', () => {
    expect(esriToGeoJson({ features: [{ attributes: {} }] }).features).toEqual([])
    expect(esriToGeoJson({}).features).toEqual([])
  })
})

describe('isGeoJsonCollection', () => {
  it('rejects esri-shaped responses', () => {
    expect(isGeoJsonCollection({ features: [] })).toBe(false)
    expect(isGeoJsonCollection(null)).toBe(false)
  })
})
