import { beforeEach, vi } from 'vitest'

const hoistedMocks = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbExecute: vi.fn(),
  getCurrentSessionUserId: vi.fn(),
}))

export function getMocks() {
  return hoistedMocks
}

vi.mock('@/db', () => ({
  db: {
    select: hoistedMocks.dbSelect,
    insert: hoistedMocks.dbInsert,
    execute: hoistedMocks.dbExecute,
  },
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionUserId: hoistedMocks.getCurrentSessionUserId,
}))

vi.mock('@/server/pushNotifications/pushNotification.service', () => ({
  pushNotificationService: {
    sendNotificationToUser: vi.fn(),
  },
}))

vi.mock('@/lib/parseServerTimestamp', () => ({
  parseServerTimestamp: (value: string | null) => (value ? new Date(value) : null),
}))

vi.mock('@/db/schema', () => ({
  sectionUser: {
    sectionId: 'section_user.section_id',
    userId: 'section_user.user_id',
    deletedAt: 'section_user.deleted_at',
  },
  sections: {
    id: 'sections.id',
    batchId: 'sections.batch_id',
    deletedAt: 'sections.deleted_at',
  },
  batches: { id: 'batches.id', meta: 'batches.meta' },
  clubs: { id: 'clubs.id', createdAt: 'clubs.created_at' },
  clubMembers: {
    id: 'club_members.id',
    userId: 'club_members.user_id',
    clubId: 'club_members.club_id',
    role: 'club_members.role',
  },
  users: {
    id: 'users.id',
    role: 'users.role',
  },
  events: {
    id: 'events.id',
    title: 'events.title',
    clubId: 'events.club_id',
    endTime: 'events.end_time',
    startTime: 'events.start_time',
    createdAt: 'events.created_at',
  },
  eventEnrollments: {
    id: 'event_enrollments.id',
    userId: 'event_enrollments.user_id',
    eventId: 'event_enrollments.event_id',
  },
}))

export function mockSelectChain(result: unknown) {
  return {
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(result),
        then: undefined,
      }),
    }),
  }
}

export function mockSelectWhereChain(result: unknown) {
  return {
    from: () => ({
      where: () => Promise.resolve(result),
    }),
  }
}

/** For queries using `.from(x).innerJoin(y, ...).where(...)` */
export function mockSelectInnerJoinWhereChain(result: unknown) {
  return {
    from: () => ({
      innerJoin: () => ({
        where: () => Promise.resolve(result),
      }),
    }),
  }
}

export function mockSelectOrderByChain(result: unknown) {
  return {
    from: () => ({
      where: () => ({
        orderBy: () => Promise.resolve(result),
      }),
      orderBy: () => Promise.resolve(result),
    }),
  }
}

export function registerCommonBeforeEach() {
  beforeEach(() => {
    vi.clearAllMocks()
  })
}
