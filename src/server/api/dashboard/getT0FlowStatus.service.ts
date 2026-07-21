import { inArray, sql } from 'drizzle-orm'
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
  /**
   * Which tour this batch shows: `'full'` when the batch has a
   * `user_batch_admission_data` row (walkthrough + program videos, agreement,
   * documents, kit, ID card), `'lite'` when the learner is enrolled but the
   * batch has no admission row (photo + download app + agreement only).
   */
  flowVariant: 'full' | 'lite'
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
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

function parseMeta(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, unknown>
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
      ? u.toString()
      : null
  } catch {
    return null
  }
}

/** Live web counts + stored app fraction → the tab's aggregate completion. */
function toTabProgress(
  web: { completed: number; total: number },
  storedAppFraction: unknown,
): GuidedTourTabProgress {
  const complete =
    isProgressComplete(web) ||
    fracValue(storedAppFraction as string | undefined) >= 1
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

  const [admissionRows, batchRows, profileRows, deviceTokenRows] =
    await Promise.all([
      normalizeRows<{
        batch_id: number
        full_fees_paid: number | boolean
        meta: unknown
      }>(
        await db.execute(sql`
        SELECT batch_id, full_fees_paid, meta
        FROM user_batch_admission_data
        WHERE user_id = ${userId} AND batch_id IN (${sql.raw(batchIdList)})
        ORDER BY batch_id ASC
      `),
      ),
      db
        .select({ id: batches.id, name: batches.name, meta: batches.meta })
        .from(batches)
        .where(inArray(batches.id, batchIds)),
      normalizeRows<{ meta: unknown; legal_data: unknown }>(
        await db.execute(sql`
        SELECT meta, legal_data FROM profiles
        WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
      `),
      ),
      db
        .select({ id: userDeviceTokens.id })
        .from(userDeviceTokens)
        .where(inArray(userDeviceTokens.userId, [userId]))
        .limit(1),
    ])

  const profileMeta = profileRows[0]?.meta
  const legalData = profileRows[0]?.legal_data
  const hasDeviceToken = deviceTokenRows.length > 0
  const profilePhotoUrl = httpUrlOrNull(parseMeta(profileMeta)['profile_pic'])
  // Prefer batch.meta.courseTitle; fall back to batch.name, then the id.
  const batchNameMap = new Map(
    batchRows.map((b) => [
      b.id,
      resolveCourseTitle(b.meta, b.name) || String(b.id),
    ]),
  )

  // Non-T0 (no admission row): enrolled users get the trimmed 3-step "lite" tour.
  if (admissionRows.length === 0) {
    // Photo + download-app are user-level (identical for every batch); the
    // agreement is the only batch-specific step. Anchor the user-level steps on
    // the most-recently-enrolled batch, then surface every *other* enrolled batch
    // that has its own signable agreement, so a multi-batch learner gets one
    // banner per pending agreement instead of only a single batch.
    const anchorBatchId = Math.max(...batchIds)
    const liteStatuses: Array<BatchT0Status> = (
      await Promise.all(
        batchIds.map(async (batchId): Promise<BatchT0Status | null> => {
          const web = await computeLiteGuidedTourProgress(
            userId,
            batchId,
            profileMeta,
            legalData,
            hasDeviceToken,
          )
          // Non-anchor batches only matter when they add a batch-specific step
          // (their agreement); otherwise they'd just repeat the user-level
          // photo/app steps the anchor batch already covers.
          if (batchId !== anchorBatchId && web.program.total <= 0) return null
          return {
            batchId,
            batchName: batchNameMap.get(batchId) ?? String(batchId),
            showProgramTab: true, // old full-fee users → program tab always unlocked
            lms: { ...web.lms, complete: isProgressComplete(web.lms) },
            program: {
              ...web.program,
              complete: isProgressComplete(web.program),
            },
            lectures: null,
            flowVariant: 'lite' as const,
          }
        }),
      )
    )
      .filter((b): b is BatchT0Status => b !== null)
      .sort((a, b) => a.batchId - b.batchId)

    const showGuidedTour = liteStatuses.some(
      (b) =>
        !b.lms.complete ||
        (b.showProgramTab && b.program !== null && !b.program.complete),
    )

    return {
      showT0Flow: true,
      batches: liteStatuses,
      profilePhotoUrl,
      downloadAppCompleted: hasDeviceToken,
      showGuidedTour,
      flowVariant: 'lite',
    }
  }

  const fullStatuses: Array<BatchT0Status> = await Promise.all(
    admissionRows.map(async (row) => {
      const batchId = Number(row.batch_id)
      const fullFeesPaid = Boolean(row.full_fees_paid)
      const meta = parseMeta(row.meta)
      const live = await computeGuidedTourProgress(
        userId,
        batchId,
        fullFeesPaid,
        profileMeta,
        legalData,
        hasDeviceToken,
        platform,
      )

      return {
        batchId,
        batchName: batchNameMap.get(batchId) ?? String(batchId),
        showProgramTab: fullFeesPaid,
        lms: toTabProgress(live.lms, meta[`lms_walkthrough_${otherPlatform}`]),
        program: live.program
          ? toTabProgress(
              live.program,
              meta[`program_onboarding_${otherPlatform}`],
            )
          : null,
        lectures: null, // filled by the overview composer for the primary batch
        flowVariant: 'full' as const,
      }
    }),
  )

  // Enrolled batches with NO admission row still need onboarding for their
  // agreement — surface them as trimmed "lite" batches alongside the full ones.
  // Photo/download-app are user-level and already covered by the full batches, so
  // we only include a lite batch when it has a signable agreement (its only
  // batch-specific step) to avoid redundant photo/app-only banners.
  const admissionBatchIds = new Set(
    admissionRows.map((r) => Number(r.batch_id)),
  )
  const liteBatchIds = batchIds.filter((id) => !admissionBatchIds.has(id))
  const liteStatuses: Array<BatchT0Status> = (
    await Promise.all(
      liteBatchIds.map(async (batchId): Promise<BatchT0Status | null> => {
        const web = await computeLiteGuidedTourProgress(
          userId,
          batchId,
          profileMeta,
          legalData,
          hasDeviceToken,
        )
        if (web.program.total <= 0) return null // no signable agreement → nothing batch-specific to onboard
        return {
          batchId,
          batchName: batchNameMap.get(batchId) ?? String(batchId),
          showProgramTab: true,
          lms: { ...web.lms, complete: isProgressComplete(web.lms) },
          program: {
            ...web.program,
            complete: isProgressComplete(web.program),
          },
          lectures: null,
          flowVariant: 'lite' as const,
        }
      }),
    )
  ).filter((b): b is BatchT0Status => b !== null)

  const batchStatuses: Array<BatchT0Status> = [
    ...fullStatuses,
    ...liteStatuses,
  ].sort((a, b) => a.batchId - b.batchId)

  const showGuidedTour = batchStatuses.some(
    (b) =>
      !b.lms.complete ||
      (b.showProgramTab && b.program !== null && !b.program.complete),
  )

  return {
    showT0Flow: true,
    batches: batchStatuses,
    profilePhotoUrl,
    downloadAppCompleted: hasDeviceToken,
    showGuidedTour,
    flowVariant: fullStatuses.length > 0 ? 'full' : 'lite',
  }
}
