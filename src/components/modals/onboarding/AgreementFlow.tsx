import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Loader2, MapPin } from 'lucide-react'
import {
  fetchAgreementData,
  recordAgreementOpen as apiRecordOpen,
  recordAgreementStep as apiRecordStep,
  saveAgreementDetails as apiSaveDetails,
  submitAgreement as apiSubmitAgreement,
  dismissAgreement as apiDismissAgreement,
} from '@/lib/api/dashboard/dashboardApi'
import type { AgreementDataResponse } from '@/server/api/dashboard/getAgreementData.service'
import type { AgreementDetailsData } from '@/server/api/dashboard/saveAgreementDetails.service'

interface FormValues {
  // Personal
  location: string
  name: string
  dob: string
  gender: string
  address: string
  // Family
  parentName: string
  parentsEmail: string
  parentsMobileCountry: string
  parentsMobile: string
  // Education & work
  currentStatus: string
  studyYear: string
  workDomain: string
  educationDetails: string
  yearOfGraduation: string
  collegeName: string
  currentCompanyName: string
  workExperience: string
  ctc: string
  // Documents
  panNumber: string
  passportNumber: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidPan(pan: string) {
  return pan.trim().length === 10
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone.trim())
}

function isEnterDetailsValid(v: FormValues): boolean {
  const today = new Date().toISOString().split('T')[0]
  const base =
    v.location.trim() !== '' &&
    v.name.trim() !== '' &&
    v.dob !== '' && v.dob <= today &&
    v.gender !== '' &&
    v.address.trim() !== '' &&
    v.parentName.trim() !== '' &&
    v.currentStatus !== '' &&
    v.educationDetails !== '' &&
    v.yearOfGraduation.length === 4 &&
    v.collegeName.trim() !== ''
  if (!base) return false
  if (v.currentStatus === 'studying' && v.studyYear === '') return false
  if (v.currentStatus === 'working' && v.workDomain.trim() === '') return false
  if (v.parentsEmail.trim() === '' || !isValidEmail(v.parentsEmail)) return false
  if (v.parentsMobile.trim() === '' || !isValidPhone(v.parentsMobile)) return false
  if (v.panNumber.trim() !== '' && !isValidPan(v.panNumber)) return false
  return true
}

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) } catch { return iso }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+91', country: 'IN' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+61', country: 'AU' },
  { code: '+971', country: 'AE' },
  { code: '+65', country: 'SG' },
  { code: '+60', country: 'MY' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
]

const EDUCATION_OPTIONS = [
  'BTech/B.E (CS)',
  'BTech/B.E (Non-CS)',
  'Graduation (CS, e.g., B.Sc Computer Science, BCA)',
  'Graduation (Non-CS, e.g., BA, BCom)',
  'Post Graduation',
  'Completed 12th/Diploma',
]

const CURRENT_STATUS_OPTIONS = [
  { value: 'completed_12th', label: 'Completed 12th' },
  { value: 'graduated_not_working', label: 'Graduated not working' },
  { value: 'studying', label: 'Studying' },
  { value: 'working', label: 'Working' },
]

const STUDY_YEAR_OPTIONS = ['I Year', 'II Year', 'Pre-final Year', 'Final Year']

// ── Step tab ───────────────────────────────────────────────────────────────────

function StepTab({
  index,
  label,
  status,
  onClick,
}: {
  index: number
  label: string
  status: 'completed' | 'active' | 'upcoming'
  onClick?: () => void
}) {
  const isActive = status === 'active'
  const displayLabel = isActive ? label : label.length > 10 ? `${label.slice(0, 10)}…` : label

  return (
    <div className="relative group/steptab" style={{ width: 190 }}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex flex-col gap-2 focus-visible:outline-none ${status === 'completed' ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center size-6 rounded-full text-sm font-medium shrink-0"
            style={{
              backgroundColor: status === 'completed' ? '#16A34A' : isActive ? '#6962AC' : '#E5E7EB',
              color: status === 'upcoming' ? '#6B7280' : '#FFFFFF',
            }}
          >
            {status === 'completed' ? <Check size={12} strokeWidth={2.5} /> : index + 1}
          </span>
          <span className="text-sm font-medium truncate" style={{ color: isActive ? '#1F2A37' : '#6B7280' }}>
            {displayLabel}
          </span>
        </div>
        <div
          className="w-full rounded-full"
          style={{ height: 4, backgroundColor: isActive ? '#6962AC' : '#E5E7EB' }}
        />
      </button>

      {!isActive && label.length > 5 && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 invisible group-hover/steptab:visible opacity-0 group-hover/steptab:opacity-100 transition-opacity duration-150">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
            {label}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

// ── Reusable field wrappers ────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  tooltip,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  tooltip?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#21191B' }}>
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="font-normal text-gray-500 ml-1">{hint}</span>}
      </label>
      {tooltip ? (
        <div className="group/field relative">
          {children}
          <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-30 invisible group-hover/field:visible opacity-0 group-hover/field:opacity-100 transition-opacity duration-150">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-relaxed" style={{ maxWidth: 360 }}>
              {tooltip}
            </div>
            <div className="absolute left-4 top-full border-[5px] border-transparent border-t-gray-900" />
          </div>
        </div>
      ) : children}
    </div>
  )
}

const inputClass =
  'w-full bg-white border border-[#E5E7EB] rounded-[6px] px-3 h-10 text-sm text-gray-900 placeholder-[#9CA3AF] focus:outline-none focus:border-[#6962AC] focus:ring-1 focus:ring-[#6962AC] transition-colors'

function SelectInput({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: Array<{ value: string; label: string } | string>
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-8`}
        style={{ color: value === '' ? '#9CA3AF' : '#111928' }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2 pb-1 border-b border-gray-100">
      <p className="text-sm font-semibold" style={{ color: '#21191B' }}>{children}</p>
    </div>
  )
}

// ── Step 1 — Enter Details ─────────────────────────────────────────────────────

function EnterDetailsStep({
  values,
  onChange,
}: {
  values: FormValues
  onChange: (field: keyof FormValues, value: string) => void
}) {
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState('')
  const [locChecked, setLocChecked] = useState(!!values.location)
  const [yearTouched, setYearTouched] = useState(false)
  const [parentEmailTouched, setParentEmailTouched] = useState(false)
  const [parentPhoneTouched, setParentPhoneTouched] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser.')
      return
    }
    setLocLoading(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          )
          const data = await res.json() as { display_name?: string }
          onChange('location', data.display_name ?? `${latitude}, ${longitude}`)
        } catch {
          onChange('location', `${pos.coords.latitude}, ${pos.coords.longitude}`)
        } finally {
          setLocLoading(false)
        }
      },
      () => {
        setLocError('Unable to fetch location. Please allow location access.')
        setLocLoading(false)
        setLocChecked(false)
      },
    )
  }, [onChange])

  function handleLocCheckbox(checked: boolean) {
    setLocChecked(checked)
    if (checked) {
      fetchLocation()
    } else {
      onChange('location', '')
      setLocError('')
    }
  }

  return (
    <div className="flex flex-col gap-4">

      <SectionHeading>Personal Information</SectionHeading>

      {/* Location */}
      <Field label="Location" required>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={locChecked}
              onChange={(e) => handleLocCheckbox(e.target.checked)}
              className="peer sr-only"
            />
            <div className="size-4 rounded border border-[#E5E7EB] bg-white peer-checked:bg-[#6962AC] peer-checked:border-[#6962AC] transition-colors flex items-center justify-center">
              {locChecked && <Check size={10} strokeWidth={3} className="text-white" />}
            </div>
          </div>
          <span className="text-sm text-gray-600 leading-snug">
            Allow location access to auto-fill your current location
          </span>
          {locLoading && <Loader2 size={14} className="animate-spin text-[#6962AC] mt-0.5 shrink-0" />}
        </label>
        {locError && <p className="mt-1.5 text-xs text-red-500">{locError}</p>}
        {values.location && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-[6px] bg-gray-50 border border-[#E5E7EB]">
            <MapPin size={14} className="text-[#6962AC] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">{values.location}</p>
          </div>
        )}
      </Field>

      {/* Full Name */}
      <Field label="Full Name" required>
        <input
          type="text"
          placeholder="Enter your full name"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
          className={inputClass}
        />
      </Field>

      {/* Date of Birth */}
      <Field label="Date of Birth" required>
        <input
          type="date"
          max={today}
          value={values.dob}
          onChange={(e) => onChange('dob', e.target.value)}
          className={`${inputClass} pr-3`}
          style={{ color: values.dob ? '#111928' : '#9CA3AF' }}
        />
      </Field>

      {/* Gender */}
      <Field label="Gender" required>
        <SelectInput
          value={values.gender}
          onChange={(v) => onChange('gender', v)}
          placeholder="Select gender"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
        />
      </Field>

      {/* Address */}
      <Field label="Address" required hint="(as per Aadhaar)">
        <input
          type="text"
          placeholder="Enter address"
          value={values.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={inputClass}
        />
      </Field>

      <SectionHeading>Family Information</SectionHeading>

      {/* Parent's Name */}
      <Field label="Parent's Name" required>
        <input
          type="text"
          placeholder="Enter parent's name"
          value={values.parentName}
          onChange={(e) => onChange('parentName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
          className={inputClass}
        />
      </Field>

      {/* Parent's Email */}
      <Field label="Parent's Email" required>
        <input
          type="email"
          placeholder="Enter parent's email"
          value={values.parentsEmail}
          onChange={(e) => onChange('parentsEmail', e.target.value)}
          onBlur={() => setParentEmailTouched(true)}
          className={inputClass}
        />
        {parentEmailTouched && (values.parentsEmail.trim() === '' ? (
          <p className="mt-1.5 text-xs text-red-500">Parent&apos;s email is required</p>
        ) : !isValidEmail(values.parentsEmail) ? (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid email address</p>
        ) : null)}
      </Field>

      {/* Parent's Mobile */}
      <Field label="Parent's Mobile" required>
        <div className="flex gap-2">
          <div className="relative" style={{ width: 100 }}>
            <select
              value={values.parentsMobileCountry}
              onChange={(e) => onChange('parentsMobileCountry', e.target.value)}
              className={`${inputClass} appearance-none pr-6`}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            maxLength={10}
            value={values.parentsMobile}
            onChange={(e) => onChange('parentsMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={() => setParentPhoneTouched(true)}
            className={`${inputClass} flex-1`}
          />
        </div>
        {parentPhoneTouched && (values.parentsMobile.trim() === '' ? (
          <p className="mt-1.5 text-xs text-red-500">Parent&apos;s mobile number is required</p>
        ) : !isValidPhone(values.parentsMobile) ? (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid 10-digit mobile number</p>
        ) : null)}
      </Field>

      <SectionHeading>Education &amp; Career</SectionHeading>

      {/* Current Status */}
      <Field label="Current Status" required>
        <SelectInput
          value={values.currentStatus}
          onChange={(v) => onChange('currentStatus', v)}
          placeholder="Select current status"
          options={CURRENT_STATUS_OPTIONS}
        />
      </Field>

      {/* Study Year — conditional */}
      {values.currentStatus === 'studying' && (
        <Field label="Study Year" required>
          <SelectInput
            value={values.studyYear}
            onChange={(v) => onChange('studyYear', v)}
            placeholder="Select study year"
            options={STUDY_YEAR_OPTIONS}
          />
        </Field>
      )}

      {/* Work Domain — conditional */}
      {values.currentStatus === 'working' && (
        <Field label="Work Domain" required>
          <SelectInput
            value={values.workDomain}
            onChange={(v) => onChange('workDomain', v)}
            placeholder="Select work domain"
            options={['Tech Domain', 'Non-tech Domain']}
          />
        </Field>
      )}

      {/* Education Details */}
      <Field label="Education Details" required>
        <SelectInput
          value={values.educationDetails}
          onChange={(v) => onChange('educationDetails', v)}
          placeholder="Select education level"
          options={EDUCATION_OPTIONS}
        />
      </Field>

      {/* Year of Graduation */}
      <Field
        label="Year of Graduation (Bachelors)"
        required
        tooltip="If you have not completed graduation or are a college dropout, mention the year of completion of your college"
      >
        <input
          type="text"
          placeholder="If you have not completed graduation or are a college dropout, mention the year of completion of your college"
          value={values.yearOfGraduation}
          onChange={(e) => onChange('yearOfGraduation', e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={() => setYearTouched(true)}
          className={inputClass}
        />
        {yearTouched && values.yearOfGraduation.length > 0 && values.yearOfGraduation.length < 4 && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid 4-digit year</p>
        )}
      </Field>

      {/* College Name */}
      <Field
        label="College Name"
        required
        tooltip="If not currently studying, mention the last studied college. For 12th completions, mention school name."
      >
        <input
          type="text"
          placeholder="If not currently studying, mention the last studied college. For 12th completions, mention school name."
          value={values.collegeName}
          onChange={(e) => onChange('collegeName', e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Current Company */}
      <Field label="Current Company Name" tooltip="Mention NA if not working">
        <input
          type="text"
          placeholder="Mention NA if not working"
          value={values.currentCompanyName}
          onChange={(e) => onChange('currentCompanyName', e.target.value)}
          className={inputClass}
        />
      </Field>

      {/* Work Experience */}
      <Field label="Years of Work Experience" tooltip="Enter 0 for no experience">
        <input
          type="text"
          placeholder="Enter 0 for no experience"
          value={values.workExperience}
          onChange={(e) => onChange('workExperience', e.target.value.replace(/\D/g, ''))}
          className={inputClass}
        />
      </Field>

      {/* CTC */}
      <Field label="CTC p.a. (if working)" tooltip="Enter annual CTC in INR">
        <input
          type="text"
          placeholder="Enter annual CTC"
          value={values.ctc}
          onChange={(e) => onChange('ctc', e.target.value.replace(/\D/g, ''))}
          className={inputClass}
        />
      </Field>

      <SectionHeading>Identity Documents</SectionHeading>

      {/* PAN */}
      <Field label="PAN Number" tooltip="Optional — enter if available">
        <input
          type="text"
          placeholder="Enter PAN Number"
          maxLength={10}
          value={values.panNumber}
          onChange={(e) => onChange('panNumber', e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          className={inputClass}
        />
        {values.panNumber.trim().length > 0 && !isValidPan(values.panNumber) && (
          <p className="mt-1.5 text-xs text-red-500">PAN must be 10 characters</p>
        )}
      </Field>

      {/* Passport */}
      <Field label="Passport Number" hint="(for international students only)">
        <input
          type="text"
          placeholder="Enter Passport Number"
          value={values.passportNumber}
          onChange={(e) => onChange('passportNumber', e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="pb-8" />
    </div>
  )
}

// ── Signature Certificate ──────────────────────────────────────────────────────

function SigRow({ label, value, labelWidth = 110 }: { label: string; value: string; labelWidth?: number }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="text-gray-500 shrink-0" style={{ width: labelWidth }}>{label}</span>
      <span className="text-gray-400 shrink-0">:</span>
      <span className="text-gray-700">{value || '—'}</span>
    </div>
  )
}

function SigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {children}
    </div>
  )
}

function SignatureCertificate({
  form,
  apiData,
  sectionId,
  signedAt,
  ipAddress,
  referenceNumber: refNumProp,
}: {
  form: FormValues
  apiData: AgreementDataResponse | null
  sectionId: number | undefined
  signedAt: string
  ipAddress: string | null
  referenceNumber: string | null
}) {
  const referenceNumber = refNumProp
    ?? apiData?.prefill?.referenceNumber
    ?? (apiData?.userId && sectionId ? `TC-${apiData.userId}-section_${sectionId}` : '—')

  const resolvedIp = ipAddress ?? apiData?.prefill?.ipAddress ?? '—'
  const viewTime = apiData?.viewTime

  return (
    <div className="flex flex-col rounded-xl bg-white border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* All sections */}
      <div className="px-8 py-6 flex flex-col gap-7">
        <SigSection title="Details">
          <SigRow label="Name" value={form.name || '—'} />
          <SigRow label="Email" value={apiData?.userEmail || '—'} />
          <SigRow label="Student Code" value={apiData?.studentCode || '—'} />
          <SigRow label="Program" value={apiData?.programName || '—'} />
          <SigRow label="Batch" value={apiData?.batchName || '—'} />
        </SigSection>

        <SigSection title="Timestamp">
          <SigRow label="Viewed" value={formatDateDisplay(viewTime)} />
          <SigRow label="Signed" value={formatDateDisplay(signedAt)} />
        </SigSection>

        <SigSection title="Signature">
          <SigRow label="IP Address" value={resolvedIp} />
          <SigRow label="Location" value={form.location || '—'} />
        </SigSection>
      </div>

      {/* Hidden cert info used internally for PDF — not shown in UI */}
      <input type="hidden" value={referenceNumber} />
    </div>
  )
}

// ── Mobile placeholder (agreement is desktop-only) ────────────────────────────

export function MobileAgreementPlaceholder({ sectionId }: { sectionId?: number }) {
  const [meta, setMeta] = useState<{ daysLeft: number; title: string } | null>(null)

  useEffect(() => {
    if (!sectionId) return
    fetchAgreementData(sectionId)
      .then((data) => setMeta({ daysLeft: data.daysLeft, title: data.sectionName ?? 'Program Agreement' }))
      .catch(() => {})
  }, [sectionId])

  const title = meta?.title ?? 'Program Agreement'
  const daysLeft = meta?.daysLeft

  return (
    <div className="flex-1 flex flex-col items-center justify-start gap-4 px-4 pt-10 pb-8 mb-8">
      {/* Illustration */}
      <img src="/agreementIcon.svg" alt="" width={120} height={120} className="shrink-0" />

      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="font-bold text-base" style={{ fontFamily: 'Poppins', color: '#111928' }}>
          {title}
        </h3>
        <p className="text-sm leading-5" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>
          This agreement can only be viewed &amp; signed on a desktop. Please switch to a computer to complete the agreement.
        </p>

        {daysLeft != null && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: '#FFF8F1', borderColor: '#FCD9BD' }}
          >
            <span
              className="text-sm font-medium text-white px-3 py-0.5 rounded-full"
              style={{ background: '#FF5A1F', fontFamily: 'Poppins' }}
            >
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </span>
            <span className="text-xs font-medium" style={{ color: '#374151', fontFamily: 'Poppins' }}>
              left to complete your agreement
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AgreementFlow ──────────────────────────────────────────────────────────────

export function AgreementFlow({
  onClose,
  onSubmit,
  sectionId,
}: {
  onClose?: () => void
  onSubmit?: () => void
  sectionId?: number
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [apiLoading, setApiLoading] = useState(!!sectionId)
  const [submitting, setSubmitting] = useState(false)
  const [apiData, setApiData] = useState<AgreementDataResponse | null>(null)
  const [agreementChecks, setAgreementChecks] = useState<Array<boolean>>([])
  const [signedAt] = useState(() => new Date().toISOString())
  const [savedIpAddress, setSavedIpAddress] = useState<string | null>(null)
  const [savedReferenceNumber, setSavedReferenceNumber] = useState<string | null>(null)
  const [form, setForm] = useState<FormValues>({
    location: '',
    name: '',
    dob: '',
    gender: '',
    address: '',
    parentName: '',
    parentsEmail: '',
    parentsMobileCountry: '+91',
    parentsMobile: '',
    currentStatus: '',
    studyYear: '',
    workDomain: '',
    educationDetails: '',
    yearOfGraduation: '',
    collegeName: '',
    currentCompanyName: '',
    workExperience: '',
    ctc: '',
    panNumber: '',
    passportNumber: '',
  })

  const apiAgreementSteps = apiData?.agreementSteps ?? null

  useEffect(() => {
    if (!sectionId) return
    setApiLoading(true)
    fetchAgreementData(sectionId)
      .then((data) => {
        setApiData(data)
        // Pre-tick accepted agreement checkboxes
        const checks = data.agreementSteps.map((s) => data.acceptedStepKeys.includes(s.key))
        setAgreementChecks(checks)

        // Resume from the first uncompleted step
        const detailsDone = !!(data.prefill?.name)
        if (detailsDone) {
          let resumeStep = 1
          for (let i = 0; i < data.agreementSteps.length; i++) {
            if (data.acceptedStepKeys.includes(data.agreementSteps[i].key)) {
              resumeStep = i + 2
            } else {
              break
            }
          }
          // Cap at last step index (signature)
          const lastStep = data.agreementSteps.length + 1
          setActiveStep(Math.min(resumeStep, lastStep))
        }

        if (data.prefill) {
          setForm((prev) => ({
            ...prev,
            name: data.prefill?.name ?? prev.name,
            dob: data.prefill?.dob ?? prev.dob,
            gender: data.prefill?.gender ?? prev.gender,
            address: data.prefill?.address ?? prev.address,
            parentName: data.prefill?.parentsName ?? prev.parentName,
            parentsEmail: data.prefill?.parentsEmail ?? prev.parentsEmail,
            parentsMobileCountry: data.prefill?.parentsMobileCountry ?? prev.parentsMobileCountry,
            parentsMobile: data.prefill?.parentsMobileNumber ?? prev.parentsMobile,
            currentStatus: data.prefill?.currentStatus ?? prev.currentStatus,
            studyYear: data.prefill?.studyYear ?? prev.studyYear,
            workDomain: data.prefill?.workDomain ?? prev.workDomain,
            educationDetails: data.prefill?.educationDetails ?? prev.educationDetails,
            yearOfGraduation: data.prefill?.yearOfGraduation ?? prev.yearOfGraduation,
            collegeName: data.prefill?.collegeName ?? prev.collegeName,
            currentCompanyName: data.prefill?.currentCompanyName ?? prev.currentCompanyName,
            workExperience: data.prefill?.workExperience ?? prev.workExperience,
            ctc: data.prefill?.ctc ?? prev.ctc,
            panNumber: data.prefill?.panNumber ?? prev.panNumber,
            passportNumber: data.prefill?.passportNumber ?? prev.passportNumber,
            location: data.prefill?.location ?? prev.location,
          }))
        }
      })
      .catch((err: unknown) => { console.error('Failed to fetch agreement data', err) })
      .finally(() => { setApiLoading(false) })

    void apiRecordOpen(sectionId).catch((err: unknown) => {
      console.error('Failed to record agreement open', err)
    })
  }, [sectionId])

  const STEPS = apiAgreementSteps != null
    ? [
        { key: 'enter_details', label: 'Enter Details' },
        ...apiAgreementSteps.map((s) => ({ key: s.key, label: s.heading })),
        { key: 'signature', label: 'Signature Certificate' },
      ]
    : [
        { key: 'enter_details', label: 'Enter Details' },
        { key: 'signature', label: 'Signature Certificate' },
      ]

  function handleChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleNext() {
    if (isLastStep) {
      // Final submit
      if (sectionId) {
        setSubmitting(true)
        try {
          await apiSubmitAgreement(sectionId)
        } catch (err) {
          console.error('Failed to submit agreement', err)
        } finally {
          setSubmitting(false)
        }
      }
      onSubmit?.()
    } else if (activeStep === 0) {
      // Save enter details
      if (sectionId) {
        let clientIp: string | undefined
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json')
          const ipJson = await ipRes.json() as { ip?: string }
          clientIp = ipJson.ip
        } catch { /* ignore — server-side header fallback will be used */ }

        const detailsData: AgreementDetailsData = {
          name: form.name,
          address: form.address,
          panNumber: form.panNumber,
          passportNumber: form.passportNumber,
          dob: form.dob,
          gender: form.gender,
          parentsName: form.parentName,
          parentsEmail: form.parentsEmail,
          parentsMobileCountry: form.parentsMobileCountry,
          parentsMobile: form.parentsMobile,
          currentStatus: form.currentStatus,
          studyYear: form.studyYear,
          workDomain: form.workDomain,
          educationDetails: form.educationDetails,
          graduationYear: form.yearOfGraduation,
          collegeName: form.collegeName,
          companyName: form.currentCompanyName,
          workExperience: form.workExperience,
          ctc: form.ctc,
          location: form.location,
          clientIp,
        }
        apiSaveDetails(sectionId, detailsData)
          .then(({ ipAddress, referenceNumber }) => {
            setSavedIpAddress(ipAddress)
            setSavedReferenceNumber(referenceNumber)
          })
          .catch((err: unknown) => {
            console.error('Failed to save agreement details', err)
          })
      }
      setActiveStep((s) => s + 1)
    } else {
      // Agreement step: record acceptance
      if (isAgreementStep && sectionId) {
        const stepKey = STEPS[activeStep].key
        void apiRecordStep(sectionId, stepKey).catch((err: unknown) => {
          console.error('Failed to record agreement step', err)
        })
      }
      setActiveStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (activeStep > 0) setActiveStep((s) => s - 1)
  }

  function handleClose() {
    if (sectionId) {
      void apiDismissAgreement(sectionId).catch((err: unknown) => {
        console.error('Failed to dismiss agreement', err)
      })
    }
    onClose?.()
  }

  const isLastStep = activeStep === STEPS.length - 1
  const isAgreementStep = activeStep > 0 && activeStep < STEPS.length - 1
  const canProceed =
    activeStep === 0 ? isEnterDetailsValid(form) :
    isAgreementStep ? (agreementChecks[activeStep - 1] ?? false) :
    true

  const displayTitle = apiData?.sectionName ?? 'Program Agreement'
  const daysLeft = apiData?.daysLeft ?? 7
  const alreadyAccepted = apiData?.alreadyAccepted ?? false
  const showDaysBadge = !(alreadyAccepted && daysLeft <= 0)

  if (apiLoading) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-[#6962AC]" />
        <p className="text-sm text-gray-500">Loading agreement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white relative">

      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex items-center justify-center size-8 rounded-full text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none z-10"
          aria-label="Close"
        >
          ✕
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-8 px-16 shrink-0">
        {showDaysBadge && (
          <div
            className="flex items-center gap-2 rounded-[56px] px-6 py-2 mb-4 border"
            style={{ background: '#FFF8F1', borderColor: '#FCD9BD' }}
          >
            <span className="text-sm font-medium text-white px-4 rounded-full" style={{ background: '#FF5A1F' }}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </span>
            <span className="text-sm" style={{ color: '#374151' }}>
              left to review and complete this agreement.
            </span>
          </div>
        )}
        <h2 className="font-bold text-center" style={{ fontFamily: 'Poppins', fontSize: 20, lineHeight: '28px', color: '#111928' }}>
          {displayTitle}
        </h2>
      </div>

      {/* Step tabs */}
      <div className="shrink-0 flex px-25">
        <div className="flex w-full justify-between">
          {STEPS.map((step, i) => (
            <StepTab
              key={step.key}
              index={i}
              label={step.label}
              status={i < activeStep ? 'completed' : i === activeStep ? 'active' : 'upcoming'}
              onClick={() => (i < activeStep ? setActiveStep(i) : undefined)}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 py-6 px-25 min-h-0">
        <div
          className="w-full h-full rounded-2xl py-6 flex justify-center overflow-auto"
          style={{ background: '#F9FAFB' }}
        >
          <div style={{ width: isAgreementStep ? 960 : 720 }}>

            {activeStep === 0 && (
              <EnterDetailsStep values={form} onChange={handleChange} />
            )}

            {isAgreementStep && apiAgreementSteps && (
              <div className="flex flex-col gap-5 pb-6">
                <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
                  <iframe
                    src={`${apiAgreementSteps[activeStep - 1].pdfUrl}#toolbar=0`}
                    title={STEPS[activeStep].label}
                    className="w-full h-full"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer select-none px-1">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreementChecks[activeStep - 1] ?? false}
                      onChange={(e) => {
                        const updated = [...agreementChecks]
                        updated[activeStep - 1] = e.target.checked
                        setAgreementChecks(updated)
                      }}
                      className="peer sr-only"
                    />
                    <div className="size-4 rounded border border-[#E5E7EB] bg-white peer-checked:bg-[#6962AC] peer-checked:border-[#6962AC] transition-colors flex items-center justify-center">
                      {(agreementChecks[activeStep - 1] ?? false) && <Check size={10} strokeWidth={3} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I acknowledge that I have read, understood, and agree to the Terms and Conditions of the program.{' '}
                    <span className="text-gray-500">
                      By checking this box, I accept and commit to all the terms outlined, recognizing that my acceptance constitutes a formal and enforceable agreement.
                    </span>
                  </p>
                </label>
              </div>
            )}

            {isLastStep && (
              <SignatureCertificate
                form={form}
                apiData={apiData}
                sectionId={sectionId}
                signedAt={signedAt}
                ipAddress={savedIpAddress}
                referenceNumber={savedReferenceNumber}
              />
            )}

          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div
        className="shrink-0 flex justify-end items-center gap-3 px-6"
        style={{ height: 64, background: '#FFFFFF', boxShadow: '0px 1px 4px rgba(0,0,0,0.2)' }}
      >
        {activeStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center font-medium rounded-lg transition-colors hover:bg-gray-100 focus-visible:outline-none border border-gray-300 text-gray-700"
            style={{ width: 100, height: 40, fontFamily: 'Poppins', fontSize: 16 }}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => { void handleNext() }}
          disabled={!canProceed || submitting}
          className="flex items-center justify-center text-white font-medium rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed gap-2"
          style={{ width: 166, height: 40, background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {isLastStep ? 'Submit' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
