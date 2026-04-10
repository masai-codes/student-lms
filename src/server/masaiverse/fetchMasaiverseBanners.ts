import { sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'

type BannerRow = {
  id: string
  title: string
  description: string | null
  ctaText: string | null
  ctaUrl: string | null
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0] as Array<T>
    }
    return result as Array<T>
  }

  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }

  return []
}

export type MasaiverseBannerType = {
  id: string
  title: string
  description: string
  ctaText: string
  ctaUrl: string
}

export const fetchMasaiverseBanners = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const rows = normalizeRows<BannerRow>(
      await db.execute(sql`
        SELECT
          mb.id,
          mb.title,
          mb.description,
          mb.cta_text AS ctaText,
          mb.cta_url AS ctaUrl
        FROM masaiverse_banners mb
        WHERE (mb.start_date IS NULL OR mb.start_date <= NOW())
          AND (mb.end_date IS NULL OR mb.end_date >= NOW())
        ORDER BY mb.created_at DESC
      `),
    )

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      ctaText: row.ctaText?.trim() || 'Know more',
      ctaUrl: row.ctaUrl?.trim() || '#',
    }))
  } catch (err) {
    console.error('🔥 Server/DB error', err)
    throw new Error('SERVER_ERROR_FETCHING_MASAIVERSE_BANNERS')
  }
})
