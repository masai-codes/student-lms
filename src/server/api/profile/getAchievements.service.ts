import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import {
  badgeConfigs,
  badges,
  batches,
  sectionUser,
  sections,
  userBadges,
} from '@/db/schema'
import { createBadgeShareKey } from '@/server/api/profile/badgeShareKey'
import { mapS3UrlToCdn } from '@/server/storage/s3ToCloudFront'
import type {
  AchievementBadgeDetail,
  AchievementItem,
} from '@/server/api/profile/profile.types'

/** `batches.meta.course_title` (a few cohorts use `courseTitle`). */
function readCourseTitle(meta: unknown): string | null {
  if (!meta || typeof meta !== 'object') return null
  const record = meta as Record<string, unknown>
  const title = record.course_title ?? record.courseTitle
  return typeof title === 'string' && title.trim() !== '' ? title.trim() : null
}

/** `sections.module` is stored lower/mixed case; the UI shows it as a heading. */
function toSentenceCase(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

interface ConfigRow {
  configId: number
  badgeId: number
  courseTitle: string | null
  sectionModuleName: string | null
  badge: AchievementBadgeDetail
}

/**
 * Every badge slot reachable by this student: one row per `badge_config` on a
 * section they are enrolled in. This is what makes *locked* badges visible —
 * the student sees what is still to earn, not just what they hold.
 */
async function loadEligibleConfigs(
  sectionIds: Array<number>,
): Promise<Array<ConfigRow>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      configId: badgeConfigs.id,
      badgeId: badges.id,
      title: badges.title,
      description: badges.description,
      image: badges.image,
      linkedinShareText: badges.linkedinShareText,
      lockedBadgeDescription: badges.lockedBadgeDescription,
      theme: badges.theme,
      batchMeta: batches.meta,
      sectionModule: sections.module,
    })
    .from(badgeConfigs)
    .innerJoin(badges, eq(badges.id, badgeConfigs.badgeId))
    .innerJoin(batches, eq(batches.id, badgeConfigs.batchId))
    .leftJoin(sections, eq(sections.id, badgeConfigs.sectionId))
    .where(inArray(badgeConfigs.sectionId, sectionIds))
    .orderBy(asc(badgeConfigs.id))

  return rows.map((row) => ({
    configId: row.configId,
    badgeId: row.badgeId,
    courseTitle: readCourseTitle(row.batchMeta),
    sectionModuleName: toSentenceCase(row.sectionModule),
    badge: {
      id: row.badgeId,
      title: row.title,
      description: row.description,
      image: mapS3UrlToCdn(row.image),
      linkedinShareText: row.linkedinShareText,
      lockedDescription: row.lockedBadgeDescription,
      theme: row.theme,
    },
  }))
}

/** Per-config award tally: how many times, and the earliest unlock date. */
async function loadAwards(
  userId: number,
  configIds: Array<number>,
): Promise<Map<number, { count: number; earliest: string | null }>> {
  const awards = new Map<number, { count: number; earliest: string | null }>()
  if (configIds.length === 0) return awards

  const rows = await db
    .select({
      badgeConfigId: userBadges.badgeConfigId,
      releaseDate: userBadges.releaseDate,
      createdAt: userBadges.createdAt,
    })
    .from(userBadges)
    .where(
      and(
        eq(userBadges.userId, userId),
        inArray(userBadges.badgeConfigId, configIds),
      ),
    )

  for (const row of rows) {
    const assignedAt = row.releaseDate ?? row.createdAt ?? null
    const existing = awards.get(row.badgeConfigId)

    if (!existing) {
      awards.set(row.badgeConfigId, { count: 1, earliest: assignedAt })
      continue
    }

    existing.count += 1
    // Duplicate awards collapse into one badge showing the *first* unlock.
    if (
      assignedAt &&
      (!existing.earliest ||
        new Date(assignedAt).getTime() < new Date(existing.earliest).getTime())
    ) {
      existing.earliest = assignedAt
    }
  }

  return awards
}

/**
 * The student's badge wall: every badge configured for their enrolled sections,
 * marked earned (with a count and unlock date) or locked.
 *
 * Awards for sections the student is no longer in are excluded — the same
 * eligibility rule the legacy `/users/me/achievements` endpoint applied.
 */
export async function getAchievements(
  userId: number,
): Promise<Array<AchievementItem>> {
  const enrolments = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  const sectionIds = [...new Set(enrolments.map((row) => row.sectionId))]
  const configs = await loadEligibleConfigs(sectionIds)
  const awards = await loadAwards(
    userId,
    configs.map((config) => config.configId),
  )

  return configs.map((config) => {
    const award = awards.get(config.configId)
    const isLocked = !award

    return {
      badgeConfigId: config.configId,
      badgeId: config.badgeId,
      releaseDate: award?.earliest ?? null,
      count: award?.count ?? 0,
      isLocked,
      courseTitle: config.courseTitle,
      sectionModuleName: config.sectionModuleName,
      // Locked badges are not shareable — there is nothing to show yet.
      shareKey: isLocked ? null : createBadgeShareKey(userId, config.configId),
      badge: config.badge,
    }
  })
}
