import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { whatsnew } from '@/db/schema'

export interface DashboardProductUpdateItem {
  id: number
  description: string
  image: string | null
}

export interface GetProductUpdatesResponse {
  productUpdates: Array<DashboardProductUpdateItem>
}

export async function getProductUpdates(): Promise<Array<DashboardProductUpdateItem>> {
  const rows = await db
    .select({
      id: whatsnew.id,
      description: whatsnew.subject,
      image: whatsnew.image,
    })
    .from(whatsnew)
    .orderBy(desc(whatsnew.createdAt))
    .limit(10)

  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    image: row.image ?? null,
  }))
}
