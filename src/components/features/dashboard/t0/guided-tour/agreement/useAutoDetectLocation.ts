import { useEffect, useState } from 'react'

export type LocationStatus = 'idle' | 'loading' | 'done' | 'error'

interface AutoDetectLocation {
  detected: string | null
  status: LocationStatus
  /** Manually (re)trigger detection, e.g. from a "Detect" button. */
  detect: () => void
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { display_name?: string }
    return data.display_name ?? null
  } catch {
    return null
  }
}

/**
 * Reverse-geocodes the browser's current position to a human-readable address
 * (via OpenStreetMap Nominatim), matching the old LMS. Auto-runs once when
 * `enabled`; also exposes `detect()` for a manual retry. Never throws.
 */
export function useAutoDetectLocation(enabled: boolean): AutoDetectLocation {
  const [detected, setDetected] = useState<string | null>(null)
  const [status, setStatus] = useState<LocationStatus>('idle')

  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(
          (address) => {
            if (address) {
              setDetected(address)
              setStatus('done')
            } else {
              setStatus('error')
            }
          },
        )
      },
      () => setStatus('error'),
    )
  }

  useEffect(() => {
    // Run once when detection becomes enabled (e.g. the agreement step opens).
    if (enabled) detect()
  }, [enabled])

  return { detected, status, detect }
}
