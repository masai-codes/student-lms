import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Loader2, MapPin, X } from 'lucide-react'
import {
  fetchAgreementData,
  recordAgreementOpen as apiRecordOpen,
  recordAgreementStep as apiRecordStep,
  submitAgreement as apiSubmitAgreement,
  dismissAgreement as apiDismissAgreement,
} from '@/lib/api/dashboard/dashboardApi'
import type { AgreementStep as ApiAgreementStep } from '@/server/api/dashboard/getAgreementData.service'
import type { AgreementFormData } from '@/server/api/dashboard/submitAgreement.service'

interface FormValues {
  // Personal
  location: string
  name: string
  email: string
  phone: string
  dob: string
  gender: string
  address: string
  // Family
  fatherName: string
  parentName: string
  parentEmail: string
  parentMobileCountry: string
  parentMobileNumber: string
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
  // Emergency contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(number: string) {
  return number.replace(/\D/g, '').length === 10
}

function isValidPan(pan: string) {
  return pan.trim().length === 10
}

function isEnterDetailsValid(v: FormValues): boolean {
  const today = new Date().toISOString().split('T')[0]
  const base =
    v.location.trim() !== '' &&
    v.name.trim() !== '' &&
    isValidEmail(v.email) &&
    isValidPhone(v.phone) &&
    v.dob !== '' && v.dob <= today &&
    v.gender !== '' &&
    v.address.trim() !== '' &&
    v.fatherName.trim() !== '' &&
    v.parentName.trim() !== '' &&
    isValidEmail(v.parentEmail) &&
    v.parentMobileCountry !== '' &&
    isValidPhone(v.parentMobileNumber) &&
    v.currentStatus !== '' &&
    v.educationDetails !== '' &&
    v.yearOfGraduation.length === 4 &&
    v.collegeName.trim() !== '' &&
    v.emergencyContactName.trim() !== '' &&
    isValidPhone(v.emergencyContactPhone) &&
    v.emergencyContactRelationship !== ''
  if (!base) return false
  if (v.currentStatus === 'studying' && v.studyYear === '') return false
  if (v.currentStatus === 'working' && v.workDomain.trim() === '') return false
  if (v.panNumber.trim() !== '' && !isValidPan(v.panNumber)) return false
  return true
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

const STUDY_YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

const RELATIONSHIP_OPTIONS = ['Parent', 'Sibling', 'Spouse', 'Friend', 'Guardian', 'Other']

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-2 focus-visible:outline-none ${status === 'completed' ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ width: 190 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center size-6 rounded-full text-sm font-medium shrink-0"
          style={{
            backgroundColor: status === 'completed' ? '#16A34A' : status === 'active' ? '#6962AC' : '#E5E7EB',
            color: status === 'upcoming' ? '#6B7280' : '#FFFFFF',
          }}
        >
          {status === 'completed' ? <Check size={12} strokeWidth={2.5} /> : index + 1}
        </span>
        <span className="text-sm font-medium" style={{ color: status === 'active' ? '#1F2A37' : '#6B7280' }}>
          {label}
        </span>
      </div>
      <div
        className="w-full rounded-full"
        style={{ height: 4, backgroundColor: status === 'active' ? '#6962AC' : '#E5E7EB' }}
      />
    </button>
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
  const [emailTouched, setEmailTouched] = useState(false)
  const [parentEmailTouched, setParentEmailTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [parentPhoneTouched, setParentPhoneTouched] = useState(false)
  const [emergencyPhoneTouched, setEmergencyPhoneTouched] = useState(false)
  const [yearTouched, setYearTouched] = useState(false)

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

      {/* Email */}
      <Field label="Email" required>
        <input
          type="email"
          placeholder="Enter your email"
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          onBlur={() => setEmailTouched(true)}
          className={inputClass}
        />
        {emailTouched && values.email.length > 0 && !isValidEmail(values.email) && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid email address</p>
        )}
      </Field>

      {/* Phone */}
      <Field label="Phone Number" required>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Enter 10-digit phone number"
          value={values.phone}
          maxLength={10}
          onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => setPhoneTouched(true)}
          className={inputClass}
        />
        {phoneTouched && values.phone.length > 0 && !isValidPhone(values.phone) && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid 10-digit phone number</p>
        )}
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

      {/* Father's Name */}
      <Field label="Father's Name" required>
        <input
          type="text"
          placeholder="Enter father's name"
          value={values.fatherName}
          onChange={(e) => onChange('fatherName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
          className={inputClass}
        />
      </Field>

      {/* Parent's Name */}
      <Field label="Parent's / Guardian's Name" required>
        <input
          type="text"
          placeholder="Enter parent's or guardian's name"
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
          value={values.parentEmail}
          onChange={(e) => onChange('parentEmail', e.target.value)}
          onBlur={() => setParentEmailTouched(true)}
          className={inputClass}
        />
        {parentEmailTouched && values.parentEmail.length > 0 && !isValidEmail(values.parentEmail) && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid email address</p>
        )}
      </Field>

      {/* Parent's Mobile */}
      <Field label="Parent's Mobile" required>
        <div className="flex gap-2">
          <div className="relative shrink-0" style={{ width: 110 }}>
            <select
              value={values.parentMobileCountry}
              onChange={(e) => onChange('parentMobileCountry', e.target.value)}
              className={`${inputClass} appearance-none pr-6 w-full`}
            >
              <option value="" disabled>Code</option>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} {c.country}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Enter mobile number"
            value={values.parentMobileNumber}
            maxLength={10}
            onChange={(e) => onChange('parentMobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={() => setParentPhoneTouched(true)}
            className={`${inputClass} flex-1`}
          />
        </div>
        {parentPhoneTouched && values.parentMobileCountry === '' && (
          <p className="mt-1.5 text-xs text-red-500">Please select a country code</p>
        )}
        {parentPhoneTouched && values.parentMobileNumber.length > 0 && !isValidPhone(values.parentMobileNumber) && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid phone number</p>
        )}
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
          <input
            type="text"
            placeholder="Enter your work domain"
            value={values.workDomain}
            onChange={(e) => onChange('workDomain', e.target.value)}
            className={inputClass}
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
          placeholder="YYYY"
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
          placeholder="Enter college name"
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

      <SectionHeading>Emergency Contact</SectionHeading>

      <Field label="Contact Name" required>
        <input
          type="text"
          placeholder="Enter emergency contact name"
          value={values.emergencyContactName}
          onChange={(e) => onChange('emergencyContactName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
          className={inputClass}
        />
      </Field>

      <Field label="Contact Phone" required>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Enter 10-digit phone number"
          value={values.emergencyContactPhone}
          maxLength={10}
          onChange={(e) => onChange('emergencyContactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={() => setEmergencyPhoneTouched(true)}
          className={inputClass}
        />
        {emergencyPhoneTouched && values.emergencyContactPhone.length > 0 && !isValidPhone(values.emergencyContactPhone) && (
          <p className="mt-1.5 text-xs text-red-500">Please enter a valid 10-digit phone number</p>
        )}
      </Field>

      <Field label="Relationship" required>
        <SelectInput
          value={values.emergencyContactRelationship}
          onChange={(v) => onChange('emergencyContactRelationship', v)}
          placeholder="Select relationship"
          options={RELATIONSHIP_OPTIONS}
        />
      </Field>

      <div className="pb-8" />
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
  const [sectionName, setSectionName] = useState<string | null>(null)
  const [daysLeft, setDaysLeft] = useState<number>(7)
  const [alreadyAccepted, setAlreadyAccepted] = useState(false)
  const [apiAgreementSteps, setApiAgreementSteps] = useState<Array<ApiAgreementStep> | null>(null)
  const [agreementChecks, setAgreementChecks] = useState<Array<boolean>>([])
  const [form, setForm] = useState<FormValues>({
    location: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    fatherName: '',
    parentName: '',
    parentEmail: '',
    parentMobileCountry: '+91',
    parentMobileNumber: '',
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
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  })

  useEffect(() => {
    if (!sectionId) return
    setApiLoading(true)
    fetchAgreementData(sectionId)
      .then((data) => {
        setSectionName(data.sectionName)
        setDaysLeft(data.daysLeft)
        setAlreadyAccepted(data.alreadyAccepted)
        setApiAgreementSteps(data.agreementSteps)
        setAgreementChecks(new Array(data.agreementSteps.length).fill(false))
        if (data.prefill) {
          setForm((prev) => ({ ...prev, ...data.prefill }))
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
      if (sectionId) {
        try {
          await apiSubmitAgreement(sectionId, form as unknown as AgreementFormData)
        } catch (err) {
          console.error('Failed to submit agreement', err)
        }
      }
      onSubmit?.()
    } else {
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

  const displayTitle = sectionName ?? 'Program Agreement'
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
          <X size={18} strokeWidth={2.5} />
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
                    src={apiAgreementSteps[activeStep - 1].pdfUrl}
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
          disabled={!canProceed}
          className="flex items-center justify-center text-white font-medium rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ width: 166, height: 40, background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
        >
          {isLastStep ? 'Submit' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
