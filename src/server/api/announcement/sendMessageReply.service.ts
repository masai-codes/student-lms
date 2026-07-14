import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { messages, users } from '@/db/schema'

function nowMysql() {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' })
    .replace('T', ' ')
}

/**
 * Inserts a reply into the messages thread.
 * Populates meta with { from, type } per the messaging spec.
 */
export async function sendMessageReply(
  currentUserId: number,
  rootMessageId: number,
  body: string,
): Promise<void> {
  const root = await db
    .select({ subject: messages.subject, authorId: messages.authorId })
    .from(messages)
    .where(eq(messages.id, rootMessageId))
    .limit(1)

  if (!root[0]) throw new Error('ROOT_MESSAGE_NOT_FOUND')

  const receiverId = root[0].authorId

  // Fetch sender and receiver in one query
  const participants = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(inArray(users.id, [currentUserId, receiverId]))

  const sender = participants.find((u) => u.id === currentUserId)
  const receiver = participants.find((u) => u.id === receiverId)

  const isAdminInvolved =
    sender?.role === 'admin' ||
    sender?.role === 'super_admin' ||
    receiver?.role === 'admin' ||
    receiver?.role === 'super_admin'

  const meta = {
    from: sender?.name ?? '',
    type: isAdminInvolved ? 'admin-student-message' : 'student-student-message',
  }

  const now = nowMysql()

  await db.insert(messages).values({
    messageId: rootMessageId,
    subject: root[0].subject,
    body,
    userId: receiverId,
    authorId: currentUserId,
    meta,
    createdAt: now,
    updatedAt: now,
  })
}
