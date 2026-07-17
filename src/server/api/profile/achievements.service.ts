import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { badgeConfigs, badges, sectionUser, userBadges } from '@/db/schema'

export interface AchievementBadge {
  title: string
  description: string | null
  image: string | null
  linkedinShareText: string | null
  lockedBadgeDescription: string | null
  theme: string | null
}

export interface AchievementItem {
  badgeConfigId: number
  badgeId: number
  isLocked: boolean
  count: number
  releaseDate: string | null
  courseTitle: string | null
  sectionModuleName: string | null
  badge: AchievementBadge
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

export async function getAchievements(
  userId: number,
): Promise<Array<AchievementItem>> {
  // Step 1 — enrolled section IDs
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  if (sectionRows.length === 0) return []

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(
    Number.isFinite,
  )
  if (sectionIds.length === 0) return []

  // Step 2 — earned badges for this user
  const earnedRows = await db
    .select({
      badgeConfigId: userBadges.badgeConfigId,
      releaseDate: userBadges.releaseDate,
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(asc(userBadges.releaseDate), asc(userBadges.createdAt))

  // Group by badgeConfigId: count + earliest releaseDate
  const earnedMap = new Map<
    number,
    { count: number; releaseDate: string | null }
  >()
  for (const row of earnedRows) {
    const existing = earnedMap.get(row.badgeConfigId)
    if (existing) {
      existing.count += 1
    } else {
      earnedMap.set(row.badgeConfigId, {
        count: 1,
        releaseDate: row.releaseDate ?? null,
      })
    }
  }

  // Step 3 — badge configs for enrolled sections (with badge metadata)
  const configRows = await db
    .select({
      bcId: badgeConfigs.id,
      badgeId: badgeConfigs.badgeId,
      sectionId: badgeConfigs.sectionId,
      batchId: badgeConfigs.batchId,
      badgeTitle: badges.title,
      badgeDescription: badges.description,
      badgeImage: badges.image,
      badgeLinkedinShareText: badges.linkedinShareText,
      badgeLockedDescription: badges.lockedBadgeDescription,
      badgeTheme: badges.theme,
    })
    .from(badgeConfigs)
    .innerJoin(badges, eq(badges.id, badgeConfigs.badgeId))
    .where(inArray(badgeConfigs.sectionId, sectionIds))
    .orderBy(desc(badgeConfigs.id))

  if (configRows.length === 0) return []

  // Fetch courseTitle from batches.meta
  const batchIds = [...new Set(configRows.map((r) => r.batchId))].filter(
    Number.isFinite,
  )
  const batchMetaMap = new Map<number, string | null>()
  if (batchIds.length > 0) {
    const rows = normalizeRows<{ id: number; courseTitle: string | null }>(
      await db.execute(sql`
        SELECT id, meta->>'$.courseTitle' AS courseTitle
        FROM batches WHERE id IN (${sql.raw(batchIds.join(', '))})
      `),
    )
    for (const r of rows) batchMetaMap.set(Number(r.id), r.courseTitle ?? null)
  }

  // Fetch section module names
  const sectionModuleMap = new Map<number, string | null>()
  const secRows = normalizeRows<{ id: number; module: string | null }>(
    await db.execute(sql`
      SELECT id, module FROM sections WHERE id IN (${sql.raw(sectionIds.join(', '))})
    `),
  )
  for (const r of secRows) sectionModuleMap.set(Number(r.id), r.module ?? null)

  // Step 4 — cross-reference and build response
  // Within each group (unlocked / locked) order is preserved as badge_configs.id DESC
  const unlocked: Array<AchievementItem> = []
  const locked: Array<AchievementItem> = []

  for (const row of configRows) {
    const earned = earnedMap.get(row.bcId)
    const item: AchievementItem = {
      badgeConfigId: row.bcId,
      badgeId: row.badgeId,
      isLocked: !earned,
      count: earned?.count ?? 0,
      releaseDate: earned?.releaseDate ?? null,
      courseTitle: batchMetaMap.get(row.batchId) ?? null,
      sectionModuleName:
        row.sectionId != null
          ? (sectionModuleMap.get(row.sectionId) ?? null)
          : null,
      badge: {
        title: row.badgeTitle,
        description: row.badgeDescription ?? null,
        image: row.badgeImage ?? null,
        linkedinShareText: row.badgeLinkedinShareText ?? null,
        lockedBadgeDescription: row.badgeLockedDescription ?? null,
        theme: row.badgeTheme ?? null,
      },
    }
    if (earned) {
      unlocked.push(item)
    } else {
      locked.push(item)
    }
  }

  // Unlocked first (badge_configs.id DESC), locked last (badge_configs.id DESC)
  return [...unlocked, ...locked]
}
