import { and, eq, isNull } from 'drizzle-orm'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { users, profiles } from '@/db/schema'
import { buildAdmissionsSsoUrl } from '@/server/admissions/createAdmissionsSsoToken'

dayjs.extend(utc)
dayjs.extend(timezone)

const IST = 'Asia/Kolkata'

export type PaymentBannerType = 'trial' | 'overdue' | 'banned'

export interface PaymentBannerInfo {
  type: PaymentBannerType
  daysRemaining: number
  paymentUrl: string
}

interface AdmissionRow {
  full_fees_paid: number | boolean
  lms_access_date: string | null
  course_fee_deadline: string | null
  payment_url: string | null
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function parseStringDate(raw: string): dayjs.Dayjs {
  return dayjs.tz(raw.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''), IST)
}

export async function getPaymentBannerInfo(userId: number): Promise<PaymentBannerInfo | null> {
  const [admRows, userRows, profileRows] = await Promise.all([
    normalizeRows<AdmissionRow>(
      await db.execute(sql`
        SELECT full_fees_paid, lms_access_date, course_fee_deadline, payment_url
        FROM user_batch_admission_data
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `)
    ),
    db.select({ id: users.id, name: users.name, email: users.email, mobile: users.mobile })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db.select({ meta: profiles.meta })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
      .limit(1),
  ])

  const adm = admRows.at(0)
  if (!adm) return null
  if (Boolean(adm.full_fees_paid)) return null
  if (!adm.lms_access_date) return null

  const now = dayjs().tz(IST)
  const lmsAccess = parseStringDate(adm.lms_access_date)
  const lmsPlus14 = lmsAccess.add(14, 'day')
  const deadline = adm.course_fee_deadline ? parseStringDate(adm.course_fee_deadline) : null
  const timerEnd = deadline && deadline.isBefore(lmsPlus14) ? deadline : lmsPlus14

  const daysUntilTimerEnd = Math.ceil(timerEnd.diff(now, 'hour') / 24)

  let type: PaymentBannerType
  let daysRemaining: number

  if (daysUntilTimerEnd > 0) {
    type = 'trial'
    daysRemaining = daysUntilTimerEnd
  } else {
    const warningEnd = timerEnd.add(7, 'day')
    const daysUntilWarningEnd = Math.ceil(warningEnd.diff(now, 'hour') / 24)
    if (daysUntilWarningEnd <= 0) return { type: 'banned', daysRemaining: 0, paymentUrl: '' }
    type = 'overdue'
    daysRemaining = daysUntilWarningEnd
  }

  let paymentUrl = adm.payment_url ?? ''
  const userRow = userRows.at(0)
  if (userRow && paymentUrl) {
    try {
      const profileMeta = (profileRows.at(0)?.meta ?? {}) as Record<string, unknown>
      const avatar = typeof profileMeta['profile_pic'] === 'string' ? profileMeta['profile_pic'] : ''
      paymentUrl = buildAdmissionsSsoUrl(
        {
          userId: userRow.id.toString(),
          name: userRow.name,
          email: userRow.email,
          mobile: userRow.mobile ?? '',
          platform: 'LMS',
          avatar,
        },
        paymentUrl,
      )
    } catch {
      // ADMISSIONS_SSO_SECRET not configured — fall back to raw URL
    }
  }

  return { type, daysRemaining, paymentUrl }
}
