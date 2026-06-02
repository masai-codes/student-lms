import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { whatsnew } from '@/db/schema'

export interface WhatsNewDetail {
  id: number
  title: string
  body: string
  image: string | null
  createdAt: string
}

function formatIST(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
  return `${datePart}, ${timePart} (IST)`
}

/**
 * Fetches a single whatsnew row by primary key.
 * No access control — any authenticated user can fetch any ID.
 */
export async function getWhatsNewById(id: number): Promise<WhatsNewDetail | null> {
  const rows = await db
    .select({
      id: whatsnew.id,
      subject: whatsnew.subject,
      body: whatsnew.body,
      image: whatsnew.image,
      createdAt: whatsnew.createdAt,
    })
    .from(whatsnew)
    .where(eq(whatsnew.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    title: row.subject,
    body: row.body,
    image: row.image ?? null,
    createdAt: formatIST(row.createdAt),
  }
}
