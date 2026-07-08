import { MapPin } from '@phosphor-icons/react'
import { CheckboxField } from '@/components/ui/form-fields'
import { Label } from '@/components/ui/label'
import type { LocationStatus } from './useAutoDetectLocation'

interface AgreementLocationFieldProps {
  consent: boolean
  onConsentChange: (checked: boolean) => void
  status: LocationStatus
  /** The detected current location, shown read-only once available. */
  location: string
  error?: string | null
}

/**
 * Location capture: a consent checkbox that auto-fills the current location via
 * the browser (no editable text field). The detected address is shown read-only
 * below the checkbox once available.
 */
export function AgreementLocationField({ consent, onConsentChange, status, location, error }: AgreementLocationFieldProps) {
  return (
    <div className="flex flex-col gap-1.5" data-testid="agreement-location">
      <Label className="text-sm font-medium text-gray-700">
        Location<span className="ml-0.5 text-red-600">*</span>
      </Label>
      <CheckboxField id="agreement-location-consent" checked={consent} onChange={onConsentChange} data-testid="agreement-location-consent">
        Allow location access to auto-fill your current location
      </CheckboxField>

      {status === 'loading' ? (
        <p className="text-xs text-gray-500" data-testid="agreement-location-status">Detecting your location…</p>
      ) : location ? (
        <p className="inline-flex items-start gap-1.5 text-sm text-gray-700" data-testid="agreement-location-value">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
          {location}
        </p>
      ) : status === 'error' ? (
        <p className="text-xs text-red-600" data-testid="agreement-location-status">
          Couldn&apos;t detect your location. Please allow access and try again.
        </p>
      ) : null}

      {error && !location ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
