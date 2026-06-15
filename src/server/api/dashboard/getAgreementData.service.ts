import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, sections } from '@/db/schema'

export interface AgreementStep {
  key: string
  heading: string
  pdfUrl: string
  order: number
}

export interface AgreementDataResponse {
  sectionName: string
  daysLeft: number
  alreadyAccepted: boolean
  agreementSteps: Array<AgreementStep>
  prefill: Partial<AgreementFormPrefill> | null
}

export interface AgreementFormPrefill {
  location: string
  name: string
  email: string
  phone: string
  dob: string
  gender: string
  address: string
  fatherName: string
  parentName: string
  parentEmail: string
  parentMobileCountry: string
  parentMobileNumber: string
  currentStatus: string
  studyYear: string
  workDomain: string
  educationDetails: string
  yearOfGraduation: string
  collegeName: string
  currentCompanyName: string
  workExperience: string
  ctc: string
  panNumber: string
  passportNumber: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

interface AgreementEntry {
  pdfUrl?: string
  heading?: string
  hidePolicy?: boolean
  order?: number
}

interface ProfileLegalData {
  lastModalCloseTime?: string | null
  agreements?: Record<string, { haveAcceptedLegalAgreement?: boolean }>
  location?: string
  name?: string
  email?: string
  phone?: string
  dob?: string
  gender?: string
  address?: string
  fatherName?: string
  parentName?: string
  parentEmail?: string
  parentMobileCountry?: string
  parentMobileNumber?: string
  currentStatus?: string
  studyYear?: string
  workDomain?: string
  educationDetails?: string
  yearOfGraduation?: string
  collegeName?: string
  currentCompanyName?: string
  workExperience?: string
  ctc?: string
  panNumber?: string
  passportNumber?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
}

export async function getAgreementData(
  sectionId: number,
  userId: number,
): Promise<AgreementDataResponse> {
  const [section] = await db
    .select({ id: sections.id, name: sections.name, settings: sections.settings })
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1)

  if (!section) throw new Error('AGREEMENT_SECTION_NOT_FOUND')

  const settings = section.settings as Record<string, unknown> | null
  const agreementsRaw = (settings?.agreements ?? {}) as Record<string, unknown>

  const agreementSteps: Array<AgreementStep> = Object.entries(agreementsRaw)
    .filter(([key, val]) => {
      if (key === 'shouldModalBeVisible') return false
      const entry = val as AgreementEntry
      return (
        typeof entry.pdfUrl === 'string' &&
        entry.pdfUrl.length > 0 &&
        typeof entry.heading === 'string' &&
        entry.heading.length > 0 &&
        entry.hidePolicy !== true
      )
    })
    .map(([key, val]) => {
      const entry = val as AgreementEntry
      return { key, heading: entry.heading as string, pdfUrl: entry.pdfUrl as string, order: entry.order ?? 0 }
    })
    .sort((a, b) => a.order - b.order)

  const [profile] = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = (profile?.legalData ?? null) as ProfileLegalData | null
  const sectionKey = `section_${sectionId}`
  const sectionAgreement = legalData?.agreements?.[sectionKey] ?? null

  const alreadyAccepted = sectionAgreement?.haveAcceptedLegalAgreement === true

  // lastModalCloseTime is now top-level in legal_data
  const lastClose = legalData?.lastModalCloseTime ?? null
  let daysLeft: number
  if (!lastClose) {
    daysLeft = 7
  } else {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastClose).getTime()) / (1000 * 60 * 60 * 24),
    )
    daysLeft = Math.max(0, 7 - daysSince)
  }

  const prefill: Partial<AgreementFormPrefill> | null = legalData ? {
    location: legalData.location,
    name: legalData.name,
    email: legalData.email,
    phone: legalData.phone,
    dob: legalData.dob,
    gender: legalData.gender,
    address: legalData.address,
    fatherName: legalData.fatherName,
    parentName: legalData.parentName,
    parentEmail: legalData.parentEmail,
    parentMobileCountry: legalData.parentMobileCountry,
    parentMobileNumber: legalData.parentMobileNumber,
    currentStatus: legalData.currentStatus,
    studyYear: legalData.studyYear,
    workDomain: legalData.workDomain,
    educationDetails: legalData.educationDetails,
    yearOfGraduation: legalData.yearOfGraduation,
    collegeName: legalData.collegeName,
    currentCompanyName: legalData.currentCompanyName,
    workExperience: legalData.workExperience,
    ctc: legalData.ctc,
    panNumber: legalData.panNumber,
    passportNumber: legalData.passportNumber,
    emergencyContactName: legalData.emergencyContactName,
    emergencyContactPhone: legalData.emergencyContactPhone,
    emergencyContactRelationship: legalData.emergencyContactRelationship,
  } : null

  return {
    sectionName: section.name,
    daysLeft,
    alreadyAccepted,
    agreementSteps,
    prefill,
  }
}
