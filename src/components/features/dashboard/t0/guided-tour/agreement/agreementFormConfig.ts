import type { SelectOption } from '@/components/ui/form-fields'
import type { AgreementFieldKey, AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

/**
 * Config-driven schema for the agreement detail form. The `AgreementStep`
 * component renders these field defs with the dumb form-field components — no
 * hardcoded JSX per field. Field keys/labels/options mirror the old LMS.
 */

export type AgreementFieldType = 'text' | 'email' | 'date' | 'number' | 'select' | 'phone'

export interface AgreementFieldDef {
  key: AgreementFieldKey
  label: string
  type: AgreementFieldType
  required?: boolean
  /** Conditional visibility (e.g. study year only when "studying"). */
  showWhen?: (v: AgreementFormValues) => boolean
  options?: Array<SelectOption>
  placeholder?: string
  maxLength?: number
  hint?: string
  /** For phone fields — the companion country-code field key. */
  countryKey?: AgreementFieldKey
}

const opt = (value: string, label: string): SelectOption => ({ value, label })

export const GENDER_OPTIONS = [opt('male', 'Male'), opt('female', 'Female'), opt('prefer_not_to_say', 'Prefer not to say')]
export const CURRENT_STATUS_OPTIONS = [
  opt('completed_12th', 'Completed 12th'),
  opt('graduated_not_working', 'Graduated but not working'),
  opt('studying', 'Studying'),
  opt('working', 'Working'),
]
export const STUDY_YEAR_OPTIONS = [
  opt('first_year', 'I Year'), opt('second_year', 'II Year'),
  opt('pre_final', 'Pre-final Year'), opt('final_year', 'Final Year'),
]
export const WORK_DOMAIN_OPTIONS = [opt('tech', 'Tech Domain'), opt('non_tech', 'Non-tech Domain')]
export const EDUCATION_OPTIONS = [
  opt('btech_cs', 'BTech/B.E (CS)'),
  opt('btech_non_cs', 'BTech/B.E (Non-CS)'),
  opt('graduation_cs', 'Graduation (CS, e.g., B.Sc Computer Science, BCA)'),
  opt('graduation_non_cs', 'Graduation (Non-CS, e.g., BA, BCom)'),
  opt('post_graduation', 'Post Graduation'),
  opt('completed_12th', 'Completed 12th/Diploma'),
]

/** Deduped dial codes (value = dial code) with the expected national-number length. */
export const COUNTRY_CODES: Array<{ value: string; label: string; length: number }> = [
  { value: '+91', label: '+91 India', length: 10 },
  { value: '+1', label: '+1 USA/Canada', length: 10 },
  { value: '+44', label: '+44 UK', length: 11 },
  { value: '+61', label: '+61 Australia', length: 9 },
  { value: '+977', label: '+977 Nepal', length: 10 },
  { value: '+94', label: '+94 Sri Lanka', length: 9 },
  { value: '+960', label: '+960 Maldives', length: 7 },
  { value: '+49', label: '+49 Germany', length: 11 },
  { value: '+33', label: '+33 France', length: 9 },
  { value: '+39', label: '+39 Italy', length: 10 },
  { value: '+34', label: '+34 Spain', length: 9 },
  { value: '+31', label: '+31 Netherlands', length: 9 },
  { value: '+86', label: '+86 China', length: 11 },
  { value: '+81', label: '+81 Japan', length: 10 },
  { value: '+82', label: '+82 South Korea', length: 10 },
  { value: '+65', label: '+65 Singapore', length: 8 },
  { value: '+852', label: '+852 Hong Kong', length: 8 },
  { value: '+971', label: '+971 UAE', length: 9 },
  { value: '+64', label: '+64 New Zealand', length: 9 },
  { value: '+55', label: '+55 Brazil', length: 11 },
  { value: '+54', label: '+54 Argentina', length: 10 },
  { value: '+27', label: '+27 South Africa', length: 9 },
  { value: '+20', label: '+20 Egypt', length: 10 },
  { value: '+234', label: '+234 Nigeria', length: 10 },
  { value: '+7', label: '+7 Russia', length: 10 },
  { value: '+52', label: '+52 Mexico', length: 10 },
]

/**
 * Ordered field defs the form renders top to bottom (one per row). Labels /
 * placeholders match the old LMS. The `location` field is intentionally NOT
 * here — it's captured via a consent checkbox + auto-detect (see AgreementStep).
 */
export const AGREEMENT_FIELDS: Array<AgreementFieldDef> = [
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter Name', hint: 'As per Aadhaar card' },
  { key: 'address', label: 'Address', type: 'text', required: true, placeholder: 'Enter Address', hint: 'As per Aadhaar card' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
  { key: 'gender', label: 'Gender', type: 'select', required: true, options: GENDER_OPTIONS, placeholder: 'Select Gender' },
  { key: 'parentsName', label: "Parent's Name", type: 'text', required: true, placeholder: "Enter Parent's Name" },
  { key: 'parentsEmail', label: "Parent's Email ID", type: 'email', required: true, placeholder: "Enter Parent's Email" },
  { key: 'parentsMobile', label: "Parent's Mobile Number", type: 'phone', required: true, countryKey: 'parentsMobileCountry', placeholder: "Enter Parent's Mobile Number" },
  { key: 'currentStatus', label: 'Current Status', type: 'select', required: true, options: CURRENT_STATUS_OPTIONS, placeholder: 'Select Current Status' },
  { key: 'studyYear', label: 'Year of Study', type: 'select', required: true, options: STUDY_YEAR_OPTIONS, placeholder: 'Select Year', showWhen: (v) => v.currentStatus === 'studying' },
  { key: 'workDomain', label: 'Work Domain', type: 'select', required: true, options: WORK_DOMAIN_OPTIONS, placeholder: 'Select Domain', showWhen: (v) => v.currentStatus === 'working' },
  { key: 'educationDetails', label: 'Education Details', type: 'select', required: true, options: EDUCATION_OPTIONS, placeholder: 'Select Education Details' },
  { key: 'graduationYear', label: 'Year of Graduation (Bachelors)', type: 'text', required: true, maxLength: 4, placeholder: 'If you have not completed graduation or are a college dropout, mention the year of completion of your college' },
  { key: 'collegeName', label: 'College Name', type: 'text', required: true, placeholder: 'If you are not currently studying, mention the last studied college / school name' },
  { key: 'companyName', label: 'Current Company Name', type: 'text', placeholder: 'Mention NA if you are not working' },
  { key: 'workExperience', label: 'Work Experience (in years)', type: 'number', placeholder: 'Enter 0 for no experience' },
  { key: 'ctc', label: 'CTC p.a (if working)', type: 'number', placeholder: 'Enter annual CTC' },
  { key: 'panNumber', label: 'PAN Number', type: 'text', maxLength: 10, placeholder: 'Enter PAN Number' },
  { key: 'passportNumber', label: 'Passport Number (for international students only)', type: 'text', placeholder: 'Enter Passport Number' },
]
