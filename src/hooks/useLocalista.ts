import { useCallback, useState } from 'react'
import type {
  Bill,
  CivicResource,
  ElectionInfo,
  GeoContext,
  JurisdictionDemographics,
  LatLng,
  Loadable,
  Representative
} from '../lib/types'
import { getFederalBills } from '../services/congress'
import {
  demoBills,
  demoDemographics,
  demoElections,
  demoGeo,
  demoReps,
  demoResources
} from '../services/demo'
import { getDemographics } from '../services/demographics'
import { getElections } from '../services/elections'
import { getFederalReps } from '../services/federal'
import { geocodeAddress, resolveJurisdictions } from '../services/geocode'
import { findLocalProvider, NATIONAL_RESOURCES } from '../services/local'
import { getStateBills } from '../services/openstates'
import { getStateRepsSmart } from '../services/stateReps'

export interface LocalistaState {
  phase: 'idle' | 'locating' | 'resolving' | 'ready' | 'demo' | 'error'
  error?: string
  geo?: GeoContext
  reps: Loadable<Representative[]>
  bills: Loadable<Bill[]>
  elections: Loadable<ElectionInfo[]>
  demographics: Loadable<JurisdictionDemographics[]>
  resources: Loadable<CivicResource[]>
}

const initial: LocalistaState = {
  phase: 'idle',
  reps: { status: 'idle' },
  bills: { status: 'idle' },
  elections: { status: 'idle' },
  demographics: { status: 'idle' },
  resources: { status: 'idle' }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Missing API keys surface as 'unavailable' (a note), not 'error'. */
function toLoadable<T>(result: PromiseSettledResult<T>, keyHint?: string): Loadable<T> {
  if (result.status === 'fulfilled') return { status: 'ready', data: result.value }
  const msg = message(result.reason)
  if (msg === 'missing-key' && keyHint) {
    return { status: 'unavailable', reason: keyHint }
  }
  return { status: 'error', message: msg }
}

export function useLocalista() {
  const [state, setState] = useState<LocalistaState>(initial)

  const loadForPoint = useCallback(async (point: LatLng, matchedAddress?: string) => {
    setState((s) => ({ ...initial, phase: 'resolving', geo: s.geo }))
    let geo: GeoContext
    try {
      geo = await resolveJurisdictions(point)
      if (matchedAddress) geo = { ...geo, matchedAddress }
    } catch (err) {
      setState({ ...initial, phase: 'error', error: message(err) })
      return
    }

    setState({
      ...initial,
      phase: 'ready',
      geo,
      reps: { status: 'loading' },
      bills: { status: 'loading' },
      elections: { status: 'loading' },
      demographics: { status: 'loading' },
      resources: { status: 'loading' }
    })

    const now = new Date()
    const localPromise = (async () => {
      const provider = findLocalProvider(geo)
      return provider
        ? provider.fetch(point, geo)
        : { jurisdictions: [], representatives: [], resources: [] }
    })()

    // Local jurisdictions (e.g. DC ward/ANC) merge into the "where you are"
    // list as soon as they arrive; failure there must not sink the panel.
    localPromise
      .then((local) => {
        if (local.jurisdictions.length > 0) {
          setState((s) =>
            s.geo === geo || s.geo?.point === geo.point
              ? {
                  ...s,
                  geo: {
                    ...geo,
                    jurisdictions: [...geo.jurisdictions, ...local.jurisdictions]
                  }
                }
              : s
          )
        }
      })
      .catch(() => {})

    const [federal, stateReps, local, federalBills, stateBills, elections, demographics] =
      await Promise.allSettled([
        getFederalReps(geo),
        getStateRepsSmart(point, geo),
        localPromise,
        getFederalBills(),
        getStateBills(geo),
        getElections(geo, now),
        getDemographics(geo)
      ])

    const reps: Representative[] = []
    const repErrors: string[] = []
    if (federal.status === 'fulfilled') reps.push(...federal.value)
    else repErrors.push(`federal: ${message(federal.reason)}`)
    if (stateReps.status === 'fulfilled') reps.push(...stateReps.value)
    else if (message(stateReps.reason) !== 'missing-key')
      repErrors.push(`state: ${message(stateReps.reason)}`)
    if (local.status === 'fulfilled') reps.push(...local.value.representatives)
    else repErrors.push(`local: ${message(local.reason)}`)

    const bills: Bill[] = []
    const billNotes: string[] = []
    for (const [settled, label] of [
      [federalBills, 'federal'],
      [stateBills, 'state']
    ] as const) {
      if (settled.status === 'fulfilled') bills.push(...settled.value)
      else if (message(settled.reason) !== 'missing-key')
        billNotes.push(`${label}: ${message(settled.reason)}`)
    }
    const missingBillKeys =
      (federalBills.status === 'rejected' &&
        message(federalBills.reason) === 'missing-key') ||
      (stateBills.status === 'rejected' && message(stateBills.reason) === 'missing-key')

    setState((s) => ({
      ...s,
      reps:
        reps.length > 0
          ? { status: 'ready', data: reps }
          : repErrors.length > 0
            ? { status: 'error', message: repErrors.join('; ') }
            : { status: 'ready', data: [] },
      bills:
        bills.length > 0
          ? { status: 'ready', data: bills }
          : billNotes.length > 0
            ? { status: 'error', message: billNotes.join('; ') }
            : missingBillKeys
              ? {
                  status: 'unavailable',
                  reason:
                    'Bill snapshots aren’t deployed yet. Run the CI data pipeline (with Congress.gov / Open States secrets), or add keys to .env.local.'
                }
              : { status: 'ready', data: [] },
      elections: toLoadable(elections),
      demographics: toLoadable(demographics),
      resources: {
        status: 'ready',
        data: [
          ...(local.status === 'fulfilled' ? local.value.resources : []),
          ...NATIONAL_RESOURCES
        ]
      }
    }))
  }, [])

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ ...initial, phase: 'error', error: 'Geolocation is not available in this browser.' })
      return
    }
    setState({ ...initial, phase: 'locating' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadForPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setState({
          ...initial,
          phase: 'error',
          error:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. You can type an address instead.'
              : `Could not get your location: ${err.message}`
        })
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  }, [loadForPoint])

  const lookupAddress = useCallback(
    async (address: string) => {
      setState({ ...initial, phase: 'locating' })
      try {
        const { point, matchedAddress } = await geocodeAddress(address)
        await loadForPoint(point, matchedAddress)
      } catch (err) {
        setState({ ...initial, phase: 'error', error: message(err) })
      }
    },
    [loadForPoint]
  )

  const loadDemo = useCallback(() => {
    setState({
      phase: 'demo',
      geo: demoGeo,
      reps: { status: 'ready', data: demoReps },
      bills: { status: 'ready', data: demoBills },
      elections: { status: 'ready', data: demoElections },
      demographics: { status: 'ready', data: demoDemographics },
      resources: { status: 'ready', data: demoResources }
    })
  }, [])

  const reset = useCallback(() => setState(initial), [])

  return { state, locate, lookupAddress, loadDemo, reset }
}
