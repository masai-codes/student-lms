import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { userBatchAdmissionData } from '@/db/schema'
import { buildAdmissionsRedirectForUser } from '@/server/admissions/buildAdmissionsRedirectForUser'
import { getAdmissionsStudentStatus } from '@/server/admissions/getAdmissionsStudentStatus'
import type { AdmissionsInvoice } from '@/server/admissions/getAdmissionsStudentStatus'
import { resolveStudentCode } from '@/server/users/getStudentCode'
import type {
  ProfileInvoice,
  StudentKitStatus,
} from '@/server/api/profile/profile.types'

const EMPTY_KIT: StudentKitStatus = {
  showKit: false,
  detailsFilled: false,
  admissionsFormUrl: null,
  trackingId: null,
  trackingUrl: null,
}

function trimmedOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/** Most recent admission enrolment — the batch these Admissions calls key off. */
async function resolveAdmissionBatchId(userId: number): Promise<number | null> {
  const rows = await db
    .select({ batchId: userBatchAdmissionData.batchId })
    .from(userBatchAdmissionData)
    .where(eq(userBatchAdmissionData.userId, userId))
    .orderBy(desc(userBatchAdmissionData.id))
    .limit(1)

  return rows.at(0)?.batchId ?? null
}

/**
 * Welcome-kit state for the Student Kit tab.
 *
 * `admissionsFormUrl` is built regardless of whether the Admissions status call
 * succeeds, so the "fill your kit details" CTA still works when that API is
 * down — the same defensive pattern the T0 flow uses.
 */
export async function getStudentKit(userId: number): Promise<StudentKitStatus> {
  const batchId = await resolveAdmissionBatchId(userId)
  const studentCode = await resolveStudentCode(userId, batchId)
  if (studentCode === '') return EMPTY_KIT

  const status = await getAdmissionsStudentStatus(studentCode, 'kit')
  const kit = status?.kit
  const showKit = kit?.showKit === true
  const detailsFilled = kit?.detailsFilled === true

  const admissionsFormUrl =
    showKit && !detailsFilled
      ? await buildAdmissionsRedirectForUser(
          userId,
          process.env.ADMISSIONS_SSO_BASE_URL ?? '',
        )
      : null

  return {
    showKit,
    detailsFilled,
    admissionsFormUrl: admissionsFormUrl || null,
    trackingId: trimmedOrNull(kit?.tracking?.trackingId),
    trackingUrl: trimmedOrNull(kit?.tracking?.trackingUrl),
  }
}

/** Amounts arrive as either a number or a numeric string depending on cohort. */
function parseAmount(value: AdmissionsInvoice['amount']): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** Settled fee payments for the My Invoices tab. Empty when unavailable. */
export async function getInvoices(
  userId: number,
): Promise<Array<ProfileInvoice>> {
  const batchId = await resolveAdmissionBatchId(userId)
  const studentCode = await resolveStudentCode(userId, batchId)
  if (studentCode === '') return []

  const status = await getAdmissionsStudentStatus(studentCode, 'invoices')
  const invoices = status?.invoices
  if (!Array.isArray(invoices)) return []

  return invoices.map((invoice) => ({
    paymentType: trimmedOrNull(invoice.paymentType) ?? 'Payment',
    amount: parseAmount(invoice.amount),
    paidOn: trimmedOrNull(invoice.paidOn),
    invoiceUrl: trimmedOrNull(invoice.invoiceUrl),
  }))
}
