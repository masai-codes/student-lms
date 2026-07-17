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
  /** Reveal the "required"/"check the box" messaging (after a Continue attempt). */
  showError?: boolean
}

/** Hosted PDF walking the learner through enabling browser location access. */
const ENABLE_LOCATION_GUIDE_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/3b23268a-b47b-4377-ab2e-5e611af56dff/Hgq0LtLPMljHXno2.pdf'

/**
 * Location capture: a consent checkbox that auto-fills the current location via
 * the browser (no editable text field). Both the checkbox and a detected
 * location are mandatory. The detected address shows read-only below once
 * available; when the box is unchecked we point the learner to a guide on
 * enabling location access.
 */
export function AgreementLocationField({
  consent,
  onConsentChange,
  status,
  location,
  showError,
}: AgreementLocationFieldProps) {
  const hasLocation = location.trim() !== ''

  return (
    <div className="flex flex-col gap-1.5" data-testid="agreement-location">
      <Label className="text-sm font-medium text-foreground">
        Location<span className="ml-0.5 text-danger">*</span>
      </Label>
      <CheckboxField
        id="agreement-location-consent"
        checked={consent}
        onChange={onConsentChange}
        data-testid="agreement-location-consent"
      >
        {status === 'loading'
          ? 'Fetching location…'
          : 'Allow location access to auto-fill your current location'}
        {!consent ? (
          <a
            href={ENABLE_LOCATION_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs text-brand underline"
            data-testid="agreement-location-guide"
          >
            (How to enable location access)
          </a>
        ) : null}
      </CheckboxField>

      {status === 'loading' ? (
        <p
          className="text-xs text-foreground-muted"
          data-testid="agreement-location-status"
        >
          Detecting your location…
        </p>
      ) : hasLocation ? (
        <p
          className="inline-flex items-start gap-1.5 text-sm text-foreground"
          data-testid="agreement-location-value"
        >
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-foreground-subtle"
            aria-hidden
          />
          {location}
        </p>
      ) : status === 'error' ? (
        <p
          className="text-xs text-danger"
          data-testid="agreement-location-status"
        >
          Couldn&apos;t detect your location.{' '}
          <a
            href={ENABLE_LOCATION_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            See how to enable location access
          </a>{' '}
          and try again.
        </p>
      ) : null}

      {/* Both the consent box and a captured location are mandatory. */}
      {showError && !hasLocation ? (
        <p
          className="text-xs text-danger"
          data-testid="agreement-location-error"
        >
          {!consent
            ? 'Please select the checkbox to fetch location.'
            : 'Location is required. Please allow location access and check the box.'}
        </p>
      ) : null}
    </div>
  )
}
