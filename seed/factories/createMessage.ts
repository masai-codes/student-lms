import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { messages } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type MessageInsert = typeof messages.$inferInsert
type MessageSelect = typeof messages.$inferSelect

export type CreateMessageOverrides = Partial<Omit<MessageInsert, 'id'>>

export async function createMessage(
  overrides: CreateMessageOverrides = {},
): Promise<MessageSelect> {
  const { userId, authorId } = overrides
  if (userId == null || authorId == null) {
    throw new Error('createMessage requires userId (recipient) and authorId')
  }

  const values: MessageInsert = {
    subject: 'For You message',
    body: 'Personal message body for local testing.',
    messageId: null,
    schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo: 15 })),
    ...overrides,
    userId,
    authorId,
  }

  const [result] = await db.insert(messages).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load message after insert (id=${id})`)
  }

  return row
}
