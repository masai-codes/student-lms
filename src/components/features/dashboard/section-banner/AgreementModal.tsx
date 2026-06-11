import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PendingAgreementSection } from '@/server/api/dashboard/getDashboardActionBanners.service'

interface FormValues {
  name: string
  address: string
  dateOfBirth: string
  gender: string
  parentName: string
  parentEmail: string
}

interface AgreementModalProps {
  section: PendingAgreementSection
  onClose: () => void
}

// ── Step indicator ─────────────────────────────────────────────────────────────

interface StepTabProps {
  index: number
  label: string
  status: 'completed' | 'active' | 'upcoming'
  onClick?: () => void
}

function StepTab({ index, label, status, onClick }: StepTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col gap-2 pb-0 focus-visible:outline-none transition-colors ${
        status === 'completed' ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Number + label row */}
      <div className={`flex items-center gap-2 px-4 pb-3 text-sm font-medium ${
        status === 'active'
          ? 'text-gray-900'
          : status === 'completed'
          ? 'text-gray-500'
          : 'text-gray-400'
      }`}>
        <span
          className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold shrink-0 ${
            status === 'active'
              ? 'bg-[#4B4396] text-white'
              : status === 'completed'
              ? 'bg-gray-300 text-gray-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {status === 'completed' ? <Check size={11} strokeWidth={2.5} /> : index + 1}
        </span>
        {label}
      </div>
      {/* Full-width underline */}
      <div className={`h-0.5 w-full rounded-full ${
        status === 'active' ? 'bg-[#4B4396]' : 'bg-gray-200'
      }`} />
    </button>
  )
}

// ── Step 1 — Enter Details form ────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function EnterDetailsStep({
  values,
  onChange,
}: {
  values: FormValues
  onChange: (field: keyof FormValues, value: string) => void
}) {
  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#4B4396] focus:ring-1 focus:ring-[#4B4396] transition-colors'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <div className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className={labelClass}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Address */}
      <div>
        <label className={labelClass}>
          Address <span className="text-red-500">*</span>{' '}
          <span className="font-normal text-gray-500">(as per Aadhaar)</span>
        </label>
        <input
          type="text"
          placeholder="Enter address"
          value={values.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className={labelClass}>
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={values.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className={`${inputClass} appearance-none pr-10`}
          >
            <option value="">Select</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className={labelClass}>
          Gender <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Title"
          value={values.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Parent's Name */}
      <div>
        <label className={labelClass}>
          Parent's Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Title"
          value={values.parentName}
          onChange={(e) => onChange('parentName', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Parent's Email */}
      <div>
        <label className={labelClass}>
          Parent's Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          placeholder="Enter email"
          value={values.parentEmail}
          onChange={(e) => onChange('parentEmail', e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  )
}

// ── Step 2+ — Agreement PDF step ───────────────────────────────────────────────

function AgreementPdfStep({ heading, pdfUrl }: { heading: string; pdfUrl: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-gray-700">{heading}</p>
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 h-[400px]">
        <iframe
          src={pdfUrl}
          title={heading}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function AgreementModal({ section, onClose }: AgreementModalProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState<FormValues>({
    name: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    parentName: '',
    parentEmail: '',
  })

  // All steps: [Enter Details, ...agreement steps, Signature Certificate]
  const allSteps = [
    { key: 'enter_details', heading: 'Enter Details' },
    ...section.steps,
    { key: 'signature', heading: 'Signature Certificate' },
  ]

  function handleChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    if (activeStep < allSteps.length - 1) {
      setActiveStep((s) => s + 1)
    }
  }

  const isLastStep = activeStep === allSteps.length - 1
  const currentStepKey = allSteps[activeStep]?.key

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Modal card — fills entire screen */}
      <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative flex flex-col items-center pt-8 pb-6 px-16 shrink-0">
          {/* Close button — absolute top-right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex items-center justify-center size-8 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Days badge */}
          {section.daysLeft != null && (
            <div className="flex items-center gap-3 border border-[#F5C9BE] bg-white rounded-full px-5 py-2 text-sm text-gray-600 mb-7">
              <span className="bg-[#E8442A] text-white text-sm font-bold px-4 py-1 rounded-full">
                {section.daysLeft} days
              </span>
              <span>left to review and complete this agreement.</span>
            </div>
          )}

          {/* Program name */}
          <h2 className="text-2xl font-bold text-gray-900 text-center leading-snug">
            {section.programName || section.heading}
          </h2>

          {/* Institution info — each line separated */}
          {section.institutionName && (
            <div className="mt-2 text-sm text-gray-500 text-center leading-relaxed">
              {section.institutionName.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* ── Step tabs — full width with side padding ──────────────────── */}
        <div className="shrink-0 px-8">
          <div className="flex w-full">
            {allSteps.map((step, i) => (
              <StepTab
                key={step.key}
                index={i}
                label={step.heading}
                status={i < activeStep ? 'completed' : i === activeStep ? 'active' : 'upcoming'}
                onClick={() => i < activeStep ? setActiveStep(i) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-[#F3F4F8] py-6 px-6">
          {/* Centered card */}
          <div className="mx-auto max-w-2xl bg-white rounded-2xl px-8 py-6">
            {currentStepKey === 'enter_details' && (
              <EnterDetailsStep values={form} onChange={handleChange} />
            )}
            {currentStepKey === 'signature' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="size-16 rounded-full bg-green-50 flex items-center justify-center">
                  <Check size={32} className="text-green-500" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Signature Certificate</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  By clicking Submit, you confirm that you have reviewed and agreed to all the terms.
                </p>
              </div>
            )}
            {currentStepKey !== 'enter_details' && currentStepKey !== 'signature' && (
              <AgreementPdfStep
                heading={allSteps[activeStep]?.heading ?? ''}
                pdfUrl={section.steps.find((s) => s.key === currentStepKey)?.pdfUrl ?? ''}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-[#4B4396] text-white text-sm font-semibold hover:bg-[#3d3680] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B4396]"
          >
            {isLastStep ? 'Submit' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
