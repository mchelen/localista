import type { CivicLevel } from './civicLevels'

/**
 * The home-page section registry: one glyph + tint + anchor id per
 * section, shared by the panel headers and the jump navigation so the
 * color/icon language stays consistent everywhere a section is
 * referenced. Orientation sections (where/map) come first; the rest are
 * the government levels, most local → least local (docs/UX_DESIGN.md §6).
 */
export interface SectionMeta {
  id: string
  icon: string
  tint: string
  /** Short label for the jump chips (section titles are longer). */
  short: string
}

export const SECTIONS = {
  where: { id: 'where-you-are', icon: '📍', tint: 'blue', short: 'Where you are' },
  map: { id: 'map', icon: '🗺️', tint: 'slate', short: 'Map' },
  neighborhood: { id: 'neighborhood', icon: '🏘️', tint: 'green', short: 'Neighborhood' },
  city: { id: 'city', icon: '🏙️', tint: 'teal', short: 'City' },
  county: { id: 'county', icon: '🏞️', tint: 'amber', short: 'County' },
  state: { id: 'state', icon: '🏛️', tint: 'violet', short: 'State' },
  federal: { id: 'federal', icon: '🇺🇸', tint: 'indigo', short: 'Federal' }
} as const satisfies Record<string, SectionMeta>

export function levelSection(level: CivicLevel): SectionMeta {
  return SECTIONS[level]
}

/** Sub-section glyphs inside each level (kind of information). */
export const CATEGORY = {
  reps: { icon: '👥', label: 'Representatives' },
  services: { icon: '🧰', label: 'Services & resources' },
  bills: { icon: '📜', label: 'Bills & measures' },
  elections: { icon: '🗳️', label: 'Next elections' },
  facts: { icon: '📊', label: 'Facts & figures' }
} as const
