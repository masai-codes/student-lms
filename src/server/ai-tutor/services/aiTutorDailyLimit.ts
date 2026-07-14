import { and, desc, eq, gte, isNotNull, lte } from 'drizzle-orm'

import type { AiTutorLimitStatus } from '../types'
import { db } from '@/db'
import { aiTutorSessions } from '@/db/schema'

export const AI_TUTOR_DAILY_LIMIT = 1000

function utcDayBoundsIso(now: Date = new Date()): {
  startIso: string
  endIso: string
} {
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  )
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  )
  return {
    startIso: start.toISOString().slice(0, 19).replace('T', ' '),
    endIso: end.toISOString().slice(0, 19).replace('T', ' '),
  }
}

export async function checkAiTutorDailyLimit(input: {
  userId: number
  dailyLimit?: number
}): Promise<AiTutorLimitStatus> {
  const dailyLimit = input.dailyLimit ?? AI_TUTOR_DAILY_LIMIT
  const { startIso, endIso } = utcDayBoundsIso()

  const todaySessions = await db
    .select({
      id: aiTutorSessions.id,
      rating: aiTutorSessions.rating,
      feedbackAt: aiTutorSessions.feedbackAt,
    })
    .from(aiTutorSessions)
    .where(
      and(
        eq(aiTutorSessions.userId, input.userId),
        isNotNull(aiTutorSessions.sessionId),
        gte(aiTutorSessions.createdAt, startIso),
        lte(aiTutorSessions.createdAt, endIso),
      ),
    )
    .orderBy(desc(aiTutorSessions.createdAt))

  const todayCount = todaySessions.length
  const lastSessionHasFeedback =
    todayCount === 0
      ? true
      : Boolean(todaySessions[0].rating) && Boolean(todaySessions[0].feedbackAt)

  const canProceed = todayCount < dailyLimit
  const remaining = dailyLimit - todayCount

  const message = canProceed
    ? `You can start ${remaining} more AI tutor session${
        remaining === 1 ? '' : 's'
      } today.`
    : `You have reached your daily limit of ${dailyLimit} AI tutor sessions. Please try again tomorrow.`

  return {
    canProceed,
    todayCount,
    message,
    lastSessionHasFeedback,
  }
}
