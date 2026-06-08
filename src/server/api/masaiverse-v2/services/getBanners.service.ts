import { asc } from 'drizzle-orm'
import { publishedBannerCondition } from './publishVisibility'
import { db } from '@/db'
import { masaiverseBanners } from '@/db/schema'

export interface MasaiverseV2Banner {
  id: string
  title: string
  description: string | null
  ctaText: string | null
  ctaUrl: string | null
  /** From `meta.isPublished`; surfaced so the admin UI can show the state. */
  isPublished: boolean
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Home-page banners, oldest first. Non-admins (and admins with admin mode off)
 * see only published banners (`meta.isPublished === true`); admins in admin mode
 * see every banner so they can manage drafts.
 */
export async function getMasaiverseBanners(
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2Banner>> {
  const rows = await db
    .select({
      id: masaiverseBanners.id,
      title: masaiverseBanners.title,
      description: masaiverseBanners.description,
      ctaText: masaiverseBanners.ctaText,
      ctaUrl: masaiverseBanners.ctaUrl,
      meta: masaiverseBanners.meta,
    })
    .from(masaiverseBanners)
    .where(publishedBannerCondition(canSeeUnpublished))
    .orderBy(asc(masaiverseBanners.createdAt))

  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    description: toStringOrNull(row.description),
    ctaText: toStringOrNull(row.ctaText),
    ctaUrl: toStringOrNull(row.ctaUrl),
    isPublished:
      (row.meta as Record<string, unknown> | null)?.isPublished === true,
  }))
}
