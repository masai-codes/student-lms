import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

export interface AgreementFormData {
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

export async function submitAgreement(
  sectionId: number,
  userId: number,
  formData: AgreementFormData,
): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  // Write acceptance + finalSignTime immediately
  const updatedSection: Record<string, unknown> = {
    ...existing,
    haveAcceptedLegalAgreement: true,
    finalSignTime: now,
    // TODO: Background PDF generation
    // 1. Fetch all PDFs from sections.settings.agreements.{key}.pdfUrl (S3 URLs)
    // 2. Merge all PDFs with a generated signature page into one combined PDF
    // 3. Upload merged PDF to S3 at: legal-agreement/{userId}/{sectionId}/{referenceNumber}_{timestamp}.pdf
    // 4. Write agreementPdfUrl and pdfGeneratedTime back to profiles.legal_data.agreements.section_{id}
    agreementPdfUrl: 'https://google.com', // dummy — replace with real S3 URL after background generation
    pdfGeneratedTime: now,                 // dummy — replace with actual completion time
  }

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        // Form fields written to top-level legal_data
        ...formData,
        agreements: {
          ...agreements,
          [sectionKey]: updatedSection,
        },
      },
    })
    .where(eq(profiles.id, profile.id))
}
