/**
 * Provenance captured when a student accepts an acknowledgement: their approximate
 * address and public IP. Both are part of the legal record, which is why the old
 * LMS refused to submit without a location.
 *
 * Unlike the old flow, nothing here runs on mount — it is called only when the
 * student presses Accept, so no page ever fires an unexplained location prompt.
 */

const IP_LOOKUP_URL = 'https://api.ipify.org?format=json'
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'
const GEOLOCATION_TIMEOUT_MS = 15_000

export class SigningContextError extends Error {
  constructor(
    readonly reason:
      | 'UNSUPPORTED'
      | 'PERMISSION_DENIED'
      | 'UNAVAILABLE'
      | 'TIMEOUT'
      | 'LOOKUP_FAILED',
    message: string,
  ) {
    super(message)
  }
}

function messageForPositionError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was blocked. Allow it in your browser settings, then try again.'
    case error.POSITION_UNAVAILABLE:
      return 'Your location could not be determined. Please try again.'
    case error.TIMEOUT:
      return 'Getting your location took too long. Please try again.'
    default:
      return 'Something went wrong getting your location. Please try again.'
  }
}

function reasonForPositionError(
  error: GeolocationPositionError,
): SigningContextError['reason'] {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'PERMISSION_DENIED'
    case error.TIMEOUT:
      return 'TIMEOUT'
    default:
      return 'UNAVAILABLE'
  }
}

function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new SigningContextError(
          'UNSUPPORTED',
          'This browser cannot share your location, so the acknowledgement cannot be signed here.',
        ),
      )
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) =>
        reject(
          new SigningContextError(
            reasonForPositionError(error),
            messageForPositionError(error),
          ),
        ),
      { timeout: GEOLOCATION_TIMEOUT_MS },
    )
  })
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const url = `${REVERSE_GEOCODE_URL}?lat=${latitude}&lon=${longitude}&format=json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new SigningContextError(
      'LOOKUP_FAILED',
      'We could not resolve your address. Please try again.',
    )
  }
  const body = (await response.json()) as { display_name?: unknown }
  if (
    typeof body.display_name !== 'string' ||
    body.display_name.trim() === ''
  ) {
    // Fall back to raw coordinates rather than blocking the signature.
    return `${latitude}, ${longitude}`
  }
  return body.display_name
}

/** Best-effort public IP. Never throws — the address is the required part. */
async function fetchPublicIp(): Promise<string> {
  try {
    const response = await fetch(IP_LOOKUP_URL)
    if (!response.ok) return ''
    const body = (await response.json()) as { ip?: unknown }
    return typeof body.ip === 'string' ? body.ip : ''
  } catch {
    return ''
  }
}

export interface SigningContext {
  location: string
  ipAddress: string
}

export async function captureSigningContext(): Promise<SigningContext> {
  const position = await requestPosition()
  const [location, ipAddress] = await Promise.all([
    reverseGeocode(position.coords.latitude, position.coords.longitude),
    fetchPublicIp(),
  ])
  return { location, ipAddress }
}
