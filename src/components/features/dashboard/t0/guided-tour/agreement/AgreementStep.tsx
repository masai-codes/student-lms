import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { HourglassMedium, Warning } from '@phosphor-icons/react'
import { AgreementDetailsForm } from './AgreementDetailsForm'
import { AgreementPdfViewer } from './AgreementPdfViewer'
import { AgreementCertificate } from './AgreementCertificate'
import { AgreementStepper } from './AgreementStepper'
import { AgreementLocationField } from './AgreementLocationField'
import { useAutoDetectLocation } from './useAutoDetectLocation'
import { isAgreementDetailsValid, validateAgreementDetails } from './agreementValidation'
import { useIsMobileViewport } from '@/components/features/chatbot/hooks/useIsMobileViewport'
import { recordAgreementViewedApi, saveAgreementDetailsApi, submitAgreementApi } from '@/lib/api/dashboard/dashboardApi'
import type { AgreementSection } from '@/server/api/dashboard/agreement/getAgreementRenderData.service'
import type { AgreementFieldKey, AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

interface AgreementStepProps {
  section: AgreementSection
  /** Called after the agreement is submitted, so the tour refetches progress. */
  onCompleted: () => void
}

const BTN_SOLID = 'inline-flex h-11 items-center justify-center rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
const BTN_OUTLINE = 'inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50'

/**
 * The full agreement flow, rendered inline in the guided tour (no modal): a
 * detail form (autosaved) → one embedded PDF + consent per document → a
 * signature summary that submits. On mobile it shows the desktop-only notice
 * (matching the old LMS). If already signed, it shows the completed summary.
 */
export function AgreementStep({ section, onCompleted }: AgreementStepProps) {
  const isMobile = useIsMobileViewport()
  const [values, setValues] = useState<AgreementFormValues>(section.savedValues)
  const [accepted, setAccepted] = useState<Record<string, boolean>>(
    Object.fromEntries(section.acceptedStepKeys.map((k) => [k, true])),
  )
  const [subIndex, setSubIndex] = useState(0)
  const [showDetailErrors, setShowDetailErrors] = useState(false)
  const [locationConsent, setLocationConsent] = useState(false)

  const stepKeys = section.steps.map((s) => s.key)
  const subStepLabels = ['Enter Details', ...section.steps.map((s) => s.heading), 'Signature Certificate']
  const errors = useMemo(() => validateAgreementDetails(values), [values])

  const saveMutation = useMutation({ mutationFn: () => saveAgreementDetailsApi(section.sectionId, values) })
  const submitMutation = useMutation({
    mutationFn: () => submitAgreementApi(section.sectionId),
    onSuccess: onCompleted,
  })

  // Stamp the first-view time (starts the review countdown) once, when the
  // learner opens an unsigned, not-yet-viewed agreement.
  const viewMutation = useMutation({ mutationFn: () => recordAgreementViewedApi(section.sectionId) })
  const viewRecordedRef = useRef(false)
  useEffect(() => {
    if (viewRecordedRef.current) return
    if (!section.completed && !section.viewTime) {
      viewRecordedRef.current = true
      viewMutation.mutate()
    }
  }, [section.completed, section.viewTime, viewMutation])

  // Location is opt-in: detection runs only after the user checks the consent box.
  const { detected, status: locationStatus } = useAutoDetectLocation(locationConsent && !section.completed && !isMobile)
  useEffect(() => {
    if (detected) setValues((v) => ({ ...v, location: detected }))
  }, [detected])

  if (isMobile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600" data-testid="agreement-mobile-notice">
        The agreement cannot be viewed or signed on a mobile device. Please use a desktop computer to access and complete it.
      </div>
    )
  }

  if (section.completed) {
    return (
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
        data-testid="agreement-completed"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <AgreementCertificate values={values} referenceNumber={section.referenceNumber} completed agreementPdfUrl={section.agreementPdfUrl} />
        </div>
      </div>
    )
  }

  const onDetails = subIndex === 0
  const onCertificate = subIndex === stepKeys.length + 1
  const currentStepKey = !onDetails && !onCertificate ? stepKeys[subIndex - 1] : null
  const currentDoc = currentStepKey ? section.steps.find((s) => s.key === currentStepKey) : null

  const canContinue = onDetails
    ? isAgreementDetailsValid(values)
    : currentStepKey
      ? accepted[currentStepKey] === true
      : true

  const goNext = () => {
    if (onDetails) {
      if (!isAgreementDetailsValid(values)) {
        setShowDetailErrors(true)
        return
      }
      saveMutation.mutate() // autosave in the background
    }
    setSubIndex((i) => i + 1)
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
      data-testid="agreement-step"
    >
      {/* Fixed header: countdown + title + stepper */}
      <div className="shrink-0 border-b border-gray-100 px-6 pt-5 pb-4">
        <div className="flex justify-center">
          {section.isClosable ? (
            <div
              className="inline-flex items-center gap-2 rounded-full bg-[#FFF1E9] px-4 py-1.5 text-sm font-medium text-[#9A4B22]"
              data-testid="agreement-countdown"
            >
              <HourglassMedium size={18} weight="fill" className="shrink-0 text-[#E76E4B]" aria-hidden />
              <span>
                <b>
                  {section.daysLeft} {section.daysLeft === 1 ? 'day' : 'days'} remaining
                </b>{' '}
                to review and sign before your LMS is paused
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 rounded-full bg-[#FDECEF] px-4 py-1.5 text-sm font-medium text-[#B71C2B]"
              data-testid="agreement-countdown"
            >
              <Warning size={18} weight="fill" className="shrink-0 text-[#DC3545]" aria-hidden />
              <span>LMS access paused — complete and sign to restore access</span>
            </div>
          )}
        </div>

        <h3 className="mt-3 text-center text-lg font-semibold text-gray-900">{section.sectionName || 'Sign your agreement'}</h3>
        <div className="mt-4 overflow-x-auto">
          <AgreementStepper
            steps={subStepLabels}
            current={subIndex}
            onSelect={(index) => {
              if (index < subIndex) setSubIndex(index) // jump back to a completed step only
            }}
          />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {onDetails ? (
          <div className="flex flex-col gap-4">
            {/* Location first — matches the reference form ordering. */}
            <AgreementLocationField
              consent={locationConsent}
              onConsentChange={setLocationConsent}
              status={locationStatus}
              location={values.location ?? ''}
              error={showDetailErrors ? (errors.location ?? null) : null}
            />
            <AgreementDetailsForm
              values={values}
              errors={errors}
              showErrors={showDetailErrors}
              onChange={(key: AgreementFieldKey, value) => setValues((v) => ({ ...v, [key]: value }))}
            />
          </div>
        ) : currentDoc ? (
          <AgreementPdfViewer
            heading={currentDoc.heading}
            pdfUrl={currentDoc.pdfUrl}
            accepted={accepted[currentDoc.key] === true}
            onAcceptChange={(v) => setAccepted((a) => ({ ...a, [currentDoc.key]: v }))}
          />
        ) : (
          <AgreementCertificate values={values} referenceNumber={section.referenceNumber} />
        )}

        {submitMutation.isError ? (
          <p className="mt-4 text-sm text-red-600" data-testid="agreement-submit-error">
            Couldn&apos;t submit. Please try again.
          </p>
        ) : null}
      </div>

      {/* Pinned footer (flex layout keeps it at the bottom while the body scrolls). */}
      <div
        className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-white px-6 py-3"
        data-testid="agreement-action-bar"
      >
        <button type="button" onClick={() => setSubIndex((i) => Math.max(0, i - 1))} disabled={subIndex === 0} className={BTN_OUTLINE} data-testid="agreement-back">
          Back
        </button>
        {onCertificate ? (
          <button type="button" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className={BTN_SOLID} data-testid="agreement-submit">
            {submitMutation.isPending ? 'Submitting…' : 'Submit & Sign'}
          </button>
        ) : (
          <button type="button" onClick={goNext} disabled={!canContinue} className={BTN_SOLID} data-testid="agreement-continue">
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
