import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, sections, batches, users } from '@/db/schema'

export interface AgreementStep {
  key: string
  heading: string
  pdfUrl: string
  order: number
}

export interface AgreementDataResponse {
  sectionName: string
  programName: string
  batchName: string
  userId: number
  userEmail: string
  studentCode: string
  viewTime: string | null
  daysLeft: number
  alreadyAccepted: boolean
  agreementSteps: Array<AgreementStep>
  prefill: Partial<AgreementFormPrefill> | null
  /** Keys of agreement steps that have already been accepted by the user */
  acceptedStepKeys: Array<string>
}

export interface AgreementFormPrefill {
  name: string
  address: string
  panNumber: string
  passportNumber: string
  dob: string
  gender: string
  parentsName: string
  parentsEmail: string
  parentsMobileCountry: string
  parentsMobileNumber: string
  currentStatus: string
  studyYear: string
  workDomain: string
  educationDetails: string
  yearOfGraduation: string
  collegeName: string
  currentCompanyName: string
  workExperience: string
  ctc: string
  location: string
  ipAddress: string
  referenceNumber: string
}

function getAgreementFieldName(stepKey: string): string {
  switch (stepKey) {
    case 'program_agreement': return 'programAgreement'
    case 'grading_policy': return 'criteriaAgreement'
    case 'posh_compliance': return 'poshAgreement'
    default: return stepKey
  }
}

interface AgreementEntry {
  pdfUrl?: string
  heading?: string
  hidePolicy?: boolean
  order?: number
}

interface ProfileLegalData {
  lastModalCloseTime?: string | null
  viewTime?: string | null
  agreements?: Record<string, {
    haveAcceptedLegalAgreement?: boolean
    name?: string
    address?: string
    panNumber?: string
    passportNumber?: string
    dateOfBirth?: string
    gender?: string
    parentsName?: string
    parentsEmail?: string
    parentsMobileCountry?: string
    parentsMobile?: string
    currentStatus?: string
    studyYear?: string
    workDomain?: string
    educationDetails?: string
    graduationYear?: string
    collegeName?: string
    companyName?: string
    workExperience?: string
    ctc?: string
    location?: string
    ipAddress?: string
    referenceNumber?: string
  }>
}

export async function getAgreementData(
  sectionId: number,
  userId: number,
): Promise<AgreementDataResponse> {
  const [section] = await db
    .select({ id: sections.id, name: sections.name, settings: sections.settings, batchId: sections.batchId })
    .from(sections)
    .where(eq(sections.id, sectionId))
    .limit(1)

  if (!section) throw new Error('AGREEMENT_SECTION_NOT_FOUND')

  const [batch] = await db
    .select({ program: batches.program, name: batches.name, batchName: batches.name })
    .from(batches)
    .where(eq(batches.id, section.batchId))
    .limit(1)

  const [userRow] = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

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

  const firstViewTime = (sectionAgreement as Record<string, unknown> | null)?.['viewTime'] as string | null ?? null
  let daysLeft: number
  if (!firstViewTime) {
    daysLeft = 7
  } else {
    const daysSinceFirstView = Math.max(0, Math.floor(
      (Date.now() - new Date(firstViewTime).getTime()) / (1000 * 60 * 60 * 24),
    ))
    daysLeft = Math.max(0, 7 - daysSinceFirstView)
  }

  const prefill: Partial<AgreementFormPrefill> | null = sectionAgreement ? {
    name: sectionAgreement.name,
    address: sectionAgreement.address,
    panNumber: sectionAgreement.panNumber,
    passportNumber: sectionAgreement.passportNumber,
    dob: sectionAgreement.dateOfBirth,
    gender: sectionAgreement.gender,
    parentsName: sectionAgreement.parentsName,
    parentsEmail: sectionAgreement.parentsEmail,
    parentsMobileCountry: sectionAgreement.parentsMobileCountry,
    parentsMobileNumber: sectionAgreement.parentsMobile,
    currentStatus: sectionAgreement.currentStatus,
    studyYear: sectionAgreement.studyYear,
    workDomain: sectionAgreement.workDomain,
    educationDetails: sectionAgreement.educationDetails,
    yearOfGraduation: sectionAgreement.graduationYear,
    collegeName: sectionAgreement.collegeName,
    currentCompanyName: sectionAgreement.companyName,
    workExperience: sectionAgreement.workExperience,
    ctc: sectionAgreement.ctc,
    location: sectionAgreement.location,
    ipAddress: sectionAgreement.ipAddress,
    referenceNumber: sectionAgreement.referenceNumber,
  } : null

  const sectionRaw = sectionAgreement as Record<string, unknown> | null
  const acceptedStepKeys = agreementSteps
    .filter((step) => !!sectionRaw?.[getAgreementFieldName(step.key)])
    .map((step) => step.key)

  return {
    userId,
    sectionName: section.name,
    programName: batch?.program ?? '',
    batchName: batch?.name ?? '',
    userEmail: userRow?.email ?? '',
    studentCode: userRow?.username ?? '',
    viewTime: (sectionAgreement as Record<string, unknown> | null)?.['viewTime'] as string | null ?? null,
    daysLeft,
    alreadyAccepted,
    agreementSteps,
    prefill,
    acceptedStepKeys,
  }
}
