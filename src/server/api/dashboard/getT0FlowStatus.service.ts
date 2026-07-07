import { inArray, sql  } from 'drizzle-orm'
import {
  computeGuidedTourProgress,
  computeLiteGuidedTourProgress,
  fracValue,
  isProgressComplete,
} from './t0/guidedTourProgress'
import type { GuidedTourPlatform } from './t0/guidedTourProgress'
import { resolveCourseTitle } from './courseTitle'
import { db } from '@/db'
import { batches, userDeviceTokens } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import type { T0FlowLecturesResult } from './getT0FlowLectures.service'

export interface GuidedTourTabProgress {
  completed: number
  total: number
  /** Complete on any platform (live web progress combined with stored app fraction). */
  complete: boolean
}

export interface BatchT0Status {
  batchId: number
  batchName: string
  showProgramTab: boolean
  lms: GuidedTourTabProgress
  /** `null` when the program tab is locked (full fees unpaid). */
  program: GuidedTourTabProgress | null
  /**
   * The batch's guided-tour lectures (walkthrough/onboarding videos, agreement,
   * flags). Populated by the overview composer for the primary batch only;
   * `null` for others (fetched on demand when the learner switches batch).
   * `getT0FlowStatus` itself always leaves this `null`.
   */
  lectures: T0FlowLecturesResult | null
}

export interface T0FlowStatus {
  showT0Flow: boolean
  batches: Array<BatchT0Status>
  profilePhotoUrl: string | null
  downloadAppCompleted: boolean
  /** Whether the guided tour should be shown instead of the dashboard. */
  showGuidedTour: boolean
  /**
   * `'full'` — the T0 onboarding (admission row exists): walkthrough + program
   * videos, agreement, documents, student kit, ID card.
   * `'lite'` — non-T0 (no admission row) enrolled users: a trimmed 3-step tour
   * with both tabs unlocked — Profile Photo + Download App (LMS Walkthrough) and
   * the Agreement (Program Onboarding). No videos / kit / documents / ID card.
   */
  flowVariant: 'full' | 'lite'
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try { return JSON.parse(String(raw)) as Record<string, unknown> } catch { return {} }
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

/** Live web counts + stored app fraction → the tab's aggregate completion. */
function toTabProgress(
  web: { completed: number; total: number },
  storedAppFraction: unknown,
): GuidedTourTabProgress {
  const complete = isProgressComplete(web) || fracValue(storedAppFraction as string | undefined) >= 1
  return { completed: web.completed, total: web.total, complete }
}

const EMPTY: T0FlowStatus = {
  showT0Flow: false,
  batches: [],
  profilePhotoUrl: null,
  downloadAppCompleted: false,
  showGuidedTour: false,
  flowVariant: 'full',
}

export async function getT0FlowStatus(
  userId: number,
  platform: GuidedTourPlatform = 'web',
): Promise<T0FlowStatus> {
  // The "other" platform's stored fraction is merged in so completion carries
  // across platforms (a step done on the app still counts on web and vice-versa).
  const otherPlatform: GuidedTourPlatform = platform === 'web' ? 'app' : 'web'
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return EMPTY

  const batchIdList = batchIds.join(', ')

  const [admissionRows, batchRows, profileRows, deviceTokenRows] = await Promise.all([
    normalizeRows<{ batch_id: number; full_fees_paid: number | boolean; meta: unknown }>(
      await db.execute(sql`
        SELECT batch_id, full_fees_paid, meta
        FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id IN (${sql.raw(batchIdList)})
        ORDER BY batch_id ASC
      `)
    ),
    db.select({ id: batches.id, name: batches.name, meta: batches.meta }).from(batches).where(inArray(batches.id, batchIds)),
    normalizeRows<{ meta: unknown; legal_data: unknown }>(
      await db.execute(sql`
        SELECT meta, legal_data FROM profiles
        WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
      `)
    ),
    db.select({ id: userDeviceTokens.id }).from(userDeviceTokens).where(inArray(userDeviceTokens.userId, [userId])).limit(1),
  ])

  const profileMeta = profileRows[0]?.meta
  const legalData = profileRows[0]?.legal_data
  const hasDeviceToken = deviceTokenRows.length > 0
  const profilePhotoUrl = httpUrlOrNull(parseMeta(profileMeta)['profile_pic'])
  // Prefer batch.meta.courseTitle; fall back to batch.name, then the id.
  const batchNameMap = new Map(
    batchRows.map((b) => [b.id, resolveCourseTitle(b.meta, b.name) || String(b.id)]),
  )

  // Non-T0 (no admission row): enrolled users get the trimmed 3-step "lite" tour.
  if (admissionRows.length === 0) {
    // Most-recently-enrolled batch anchors the agreement step (the only
    // batch-specific one); photo + app are user-level.
    const batchId = Math.max(...batchIds)
    const web = await computeLiteGuidedTourProgress(userId, batchId, profileMeta, legalData, hasDeviceToken)
    const lms: GuidedTourTabProgress = { ...web.lms, complete: isProgressComplete(web.lms) }
    const program: GuidedTourTabProgress = { ...web.program, complete: isProgressComplete(web.program) }

    return {
      showT0Flow: true,
      batches: [
        {
          batchId,
          batchName: batchNameMap.get(batchId) ?? String(batchId),
          showProgramTab: true, // old full-fee users → program tab always unlocked
          lms,
          program,
          lectures: null,
        },
      ],
      profilePhotoUrl,
      downloadAppCompleted: hasDeviceToken,
      showGuidedTour: !lms.complete || !program.complete,
      flowVariant: 'lite',
    }
  }

  const batchStatuses: Array<BatchT0Status> = await Promise.all(
    admissionRows.map(async (row) => {
      const batchId = Number(row.batch_id)
      const fullFeesPaid = Boolean(row.full_fees_paid)
      const meta = parseMeta(row.meta)
      const live = await computeGuidedTourProgress(userId, batchId, fullFeesPaid, profileMeta, legalData, hasDeviceToken, platform)

      return {
        batchId,
        batchName: batchNameMap.get(batchId) ?? String(batchId),
        showProgramTab: fullFeesPaid,
        lms: toTabProgress(live.lms, meta[`lms_walkthrough_${otherPlatform}`]),
        program: live.program ? toTabProgress(live.program, meta[`program_onboarding_${otherPlatform}`]) : null,
        lectures: null, // filled by the overview composer for the primary batch
      }
    }),
  )

  const showGuidedTour = batchStatuses.some(
    (b) => !b.lms.complete || (b.showProgramTab && b.program !== null && !b.program.complete),
  )

  return {
    showT0Flow: true,
    batches: batchStatuses,
    profilePhotoUrl,
    downloadAppCompleted: hasDeviceToken,
    showGuidedTour,
    flowVariant: 'full',
  }
}
