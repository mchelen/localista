import { useState, type FormEvent } from 'react'

interface LocationBarProps {
  busy: boolean
  onLocate: () => void
  onAddress: (address: string) => void
  onDemo: () => void
}

export function LocationBar({ busy, onLocate, onAddress, onDemo }: LocationBarProps) {
  const [address, setAddress] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (address.trim()) onAddress(address.trim())
  }

  return (
    <div className="location-bar">
      <button type="button" className="primary" onClick={onLocate} disabled={busy}>
        📍 Use my location
      </button>
      <form onSubmit={submit} className="address-form">
        <label htmlFor="address" className="visually-hidden">
          Street address
        </label>
        <input
          id="address"
          type="text"
          placeholder="…or type an address (street, city, state)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !address.trim()}>
          Look up
        </button>
      </form>
      <button type="button" className="ghost" onClick={onDemo} disabled={busy}>
        Try the demo (Washington, DC)
      </button>
    </div>
  )
}
