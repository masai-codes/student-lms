import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export interface AgreementDetailsData {
  name: string
  address: string
  panNumber: string
  passportNumber: string
  dob: string
  gender: string
  parentsName: string
  parentsEmail: string
  parentsMobileCountry: string
  parentsMobile: string
  currentStatus: string
  studyYear: string
  workDomain: string
  educationDetails: string
  graduationYear: string
  collegeName: string
  companyName: string
  workExperience: string
  ctc: string
  location: string
  clientIp?: string
}

export async function saveAgreementDetails(
  sectionId: number,
  userId: number,
  data: AgreementDetailsData,
  ipAddress: string,
  deviceDetails: string,
): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  const referenceNumber = `TC-${userId}-section_${sectionId}`
  const isFirstTime = !existing.name
  const timeKey = isFirstTime ? 'formDetailCreateTime' : 'formDetailUpdateTime'

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: {
            ...existing,
            name: data.name,
            address: data.address,
            panNumber: data.panNumber,
            passportNumber: data.passportNumber,
            dateOfBirth: data.dob,
            gender: data.gender,
            parentsName: data.parentsName,
            parentsEmail: data.parentsEmail,
            parentsMobileCountry: data.parentsMobileCountry,
            parentsMobile: data.parentsMobile,
            currentStatus: data.currentStatus,
            studyYear: data.studyYear,
            workDomain: data.workDomain,
            educationDetails: data.educationDetails,
            graduationYear: data.graduationYear,
            collegeName: data.collegeName,
            companyName: data.companyName || 'NA',
            workExperience: data.workExperience || '0',
            ctc: data.ctc || '0',
            location: data.location,
            ipAddress,
            deviceDetails,
            referenceNumber,
            [timeKey]: now,
          },
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
