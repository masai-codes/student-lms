import {
  mysqlTable,
  index,
  foreignKey,
  primaryKey,
  int,
  bigint,
  json,
  varchar,
  text,
  tinyint,
  unique,
  date,
  mysqlEnum,
  double,
  longtext,
  mediumint,
  smallint,
  decimal,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
// Timezone-safe replacements for `datetime` (IST wall-clock) and `timestamp`
// (UTC). Reads return offset-stamped ISO strings so no call site has to know
// the convention. See ./columnTypes for details.
import {
  istDatetime as datetime,
  utcTimestamp as timestamp,
} from './columnTypes'

export const aiChatPracticeQuestions = mysqlTable(
  'ai_chat_practice_questions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    lectureId: int({ unsigned: true })
      .notNull()
      .references(() => lectures.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    userId: bigint({ mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    chatHistory: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    feedback: varchar({ length: 191 }),
    feedbackTime: timestamp('feedback_time', { mode: 'string' }),
    rating: int(),
  },
  (table) => [
    index('ai_chat_practice_questions_created_at_idx').on(table.createdAt),
    primaryKey({ columns: [table.id], name: 'ai_chat_practice_questions_id' }),
  ],
)

export const aiTutorSessions = mysqlTable(
  'ai_tutor_sessions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    uniqueId: varchar('unique_id', { length: 255 }).notNull(),
    sessionId: varchar('session_id', { length: 255 }),
    roomName: varchar('room_name', { length: 255 }),
    token: text(),
    websocketUrl: varchar('websocket_url', { length: 500 }),
    language: varchar({ length: 50 }),
    durationMinutes: int('duration_minutes'),
    participantName: varchar('participant_name', { length: 255 }),
    errorMessage: text('error_message'),
    rating: tinyint({ unsigned: true }),
    feedback: text(),
    feedbackAt: timestamp('feedback_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    index('ai_tutor_sessions_created_at_index').on(table.createdAt),
    index('ai_tutor_sessions_lecture_id_index').on(table.lectureId),
    index('ai_tutor_sessions_unique_id_index').on(table.uniqueId),
    index('ai_tutor_sessions_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'ai_tutor_sessions_id' }),
  ],
)

export const announcementReads = mysqlTable(
  'announcement_reads',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    announcementId: int('announcement_id', { unsigned: true })
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: datetime('read_at', { mode: 'string' }),
    isUnread: tinyint('is_unread').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    popupDisplay: tinyint('popup_display'),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('announcement_reads_user_id_is_unread_index').on(
      table.userId,
      table.isUnread,
    ),
    primaryKey({ columns: [table.id], name: 'announcement_reads_id' }),
    unique('announcement_reads_announcement_id_user_id_unique').on(
      table.announcementId,
      table.userId,
    ),
  ],
)

export const announcements = mysqlTable(
  'announcements',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    subject: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    type: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    tags: varchar({ length: 255 }),
    optional: tinyint().default(0).notNull(),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    week: tinyint({ unsigned: true }).notNull(),
    day: tinyint({ unsigned: true }).notNull(),
    schedule: datetime({ mode: 'string' }),
    concludes: datetime({ mode: 'string' }),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    ctaLink: varchar('cta_link', { length: 255 }),
    ctaName: varchar('cta_name', { length: 255 }),
    meta: json().$type<Record<string, any>>(),
    showAsPopup: tinyint('show_as_popup').default(0).notNull(),
    trackRead: tinyint('track_read'),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'announcements_id' })],
)

export const assessNpsForm = mysqlTable(
  'assess_nps_form',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    templateId: varchar('template_id', { length: 191 }),
    clientId: varchar('client_id', { length: 191 }),
    startsAt: datetime('starts_at', { mode: 'string' }),
    endsAt: datetime('ends_at', { mode: 'string' }),
    allowMultipleAttempts: tinyint('allow_multiple_attempts')
      .default(0)
      .notNull(),
    maxAttempts: int('max_attempts'),
    settings: json().$type<Record<string, any>>(),
    meta: json().$type<Record<string, any>>(),
    logs: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'assess_nps_form_id' })],
)

export const assessNpsSubmissions = mysqlTable(
  'assess_nps_submissions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    npsFormId: int('nps_form_id', { unsigned: true })
      .notNull()
      .references(() => assessNpsForm.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    templateId: varchar('template_id', { length: 191 }),
    clientId: varchar('client_id', { length: 191 }),
    assessLink: text('assess_link'),
    assessCallback: text('assess_callback'),
    startsAt: datetime('starts_at', { mode: 'string' }),
    completedAt: datetime('completed_at', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'assess_nps_submissions_id' }),
    unique('assess_nps_submissions_form_user_unique').on(
      table.npsFormId,
      table.userId,
    ),
  ],
)

export const assignmentProblem = mysqlTable(
  'assignment_problem',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    assignmentId: int('assignment_id', { unsigned: true })
      .notNull()
      .references(() => assignments.id),
    problemId: int('problem_id', { unsigned: true })
      .notNull()
      .references(() => problems.id),
    priority: tinyint({ unsigned: true }).default(0).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'assignment_problem_id' }),
  ],
)

export const assignments = mysqlTable(
  'assignments',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    tags: varchar({ length: 255 }),
    instructions: text(),
    optional: tinyint().default(0).notNull(),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    week: tinyint({ unsigned: true }).notNull(),
    day: tinyint({ unsigned: true }).notNull(),
    showScores: tinyint('show_scores').default(0).notNull(),
    schedule: datetime({ mode: 'string' }),
    concludes: datetime({ mode: 'string' }),
    settings: json().$type<Record<string, any>>(),
    data: json().$type<Record<string, any>>(),
    buckets: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    weightage: int().default(0).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startDate: date('start_date', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endDate: date('end_date', { mode: 'string' }),
    startTime: int('start_time'),
    endTime: int('end_time'),
    addToBlueprint: tinyint('add_to_blueprint').default(1).notNull(),
    enforceDeadline: tinyint('enforce_deadline').default(1),
    showSubmission: tinyint('show_submission').default(0).notNull(),
    platform: varchar({ length: 191 }),
    getsRemainingTime: tinyint('gets_remaining_time').default(0).notNull(),
    allowPractice: tinyint('allow_practice').default(0).notNull(),
    learningObjectives: json('learning_objectives').$type<
      Record<string, any>
    >(),
    module: varchar({ length: 255 }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'assignments_id' })],
)

export const attendances = mysqlTable(
  'attendances',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).references(
      () => users.id,
    ),
    hostId: bigint('host_id', { mode: 'number', unsigned: true }).references(
      () => users.id,
    ),
    category: varchar({ length: 255 }).notNull(),
    duration: int().notNull(),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    sectionId: int('section_id', { unsigned: true })
      .notNull()
      .references(() => sections.id),
    type: varchar({ length: 255 }).notNull(),
    status: int().notNull(),
    schedule: datetime({ mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    joinedLate: tinyint('joined_late').default(0).notNull(),
    lateByMinutes: int('late_by_minutes', { unsigned: true }),
  },
  (table) => [
    index('attendances_batch_id_index').on(table.batchId),
    index('attendances_lecture_id_index').on(table.lectureId),
    index('attendances_section_id_index').on(table.sectionId),
    index('attendances_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'attendances_id' }),
    unique('attendances_lecture_id_user_id_key').on(
      table.lectureId,
      table.userId,
    ),
  ],
)

export const badgeConfigs = mysqlTable(
  'badge_configs',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    badgeId: int('badge_id', { unsigned: true })
      .notNull()
      .references(() => badges.id),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    lectureCriteria: mysqlEnum('lecture_criteria', [
      'none',
      'mandatory',
      'recommended',
      'both',
    ])
      .default('none')
      .notNull(),
    lectureCriteriaPercentage: double('lecture_criteria_percentage'),
    assignmentCriteria: mysqlEnum('assignment_criteria', [
      'none',
      'mandatory',
      'recommended',
      'both',
    ])
      .default('none')
      .notNull(),
    assignmentSubmissionCriteriaPercentage: double(
      'assignment_submission_criteria_percentage',
    ),
    assignmentScoreCriteriaPercentage: double(
      'assignment_score_criteria_percentage',
    ),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    assignmentTypesCriteria: json('assignment_types_criteria').$type<
      Record<string, any>
    >(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'badge_configs_id' }),
    unique('badge_configs_badge_id_section_id_unique').on(
      table.badgeId,
      table.sectionId,
    ),
  ],
)

export const badges = mysqlTable(
  'badges',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    image: varchar({ length: 2048 }).notNull(),
    linkedinShareText: text('linkedin_share_text'),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    lockedBadgeDescription: text('locked_badge_description'),
    theme: varchar({ length: 255 }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'badges_id' })],
)

export const banners = mysqlTable(
  'banners',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    type: varchar({ length: 100 }).notNull(),
    variant: varchar({ length: 100 }),
    groupName: varchar('group_name', { length: 150 }),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    imageUrl: varchar('image_url', { length: 500 }).notNull(),
    ctaUrl: varchar('cta_url', { length: 500 }).notNull(),
    visibleTo: json('visible_to').$type<Record<string, any>>().notNull(),
    isActive: tinyint('is_active').default(1).notNull(),
    startDate: datetime('start_date', { mode: 'string' }),
    endDate: datetime('end_date', { mode: 'string' }),
    data: json().$type<Record<string, any>>(),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    index('idx_banners_group_name').on(table.groupName),
    index('idx_banners_is_active').on(table.isActive),
    index('idx_banners_type').on(table.type),
    index('idx_banners_variant').on(table.variant),
    primaryKey({ columns: [table.id], name: 'banners_id' }),
    unique('banners_group_name_key').on(table.groupName),
  ],
)

export const batchUser = mysqlTable(
  'batch_user',
  {
    id: int().autoincrement().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    updatedAt: datetime('updated_at', { mode: 'string' }).default(
      sql`(CURRENT_TIMESTAMP)`,
    ),
    deletedAt: datetime('deleted_at', { mode: 'string' }),
    username: varchar({ length: 300 }),
    admission: varchar({ length: 300 }),
    role: varchar({ length: 300 }),
    inTime: datetime('in_time', { mode: 'string' }),
    outTime: datetime('out_time', { mode: 'string' }),
    isActive: tinyint('is_active'),
    meta: varchar({ length: 300 }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    history: json().$type<Record<string, any>>(),
    status: varchar({ length: 300 }),
    // Enrolment id from the external admissions platform (large number).
    enrolmentId: bigint('enrolment_id', { mode: 'number', unsigned: true }),
    // Batch-transfer id from the external admissions platform (large number).
    batchTransferId: bigint('batch_transfer_id', {
      mode: 'number',
      unsigned: true,
    }),
    // Batch-transfer status; values are a code-level enum (BATCH_TRANSFER_STATUS),
    // deliberately not a DB enum.
    batchTransferStatus: varchar('batch_transfer_status', { length: 50 }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'batch_user_id' })],
)

export const batches = mysqlTable(
  'batches',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starting: date({ mode: 'string' }).notNull(),
    duration: varchar({ length: 255 }).notNull(),
    program: varchar({ length: 255 }).notNull(),
    active: tinyint().default(1).notNull(),
    options: json().$type<Record<string, any>>(),
    meta: json().$type<Record<string, any>>(),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    ending: date({ mode: 'string' }),
    mode: varchar({ length: 255 }),
    model: varchar({ length: 255 }),
    durationMonths: int('duration_months'),
    iteration: int(),
    language: varchar({ length: 50 }),
    partners: varchar({ length: 255 }),
    programDomain: varchar('program_domain', { length: 255 }),
    programType: varchar('program_type', { length: 255 }),
  },
  (table) => [
    index('idx_active').on(table.active),
    index('idx_active_starting').on(table.active, table.starting),
    index('idx_duration').on(table.duration),
    index('idx_name').on(table.name),
    index('idx_program').on(table.program),
    index('idx_starting').on(table.starting),
    index('idx_starting_active').on(table.starting, table.active),
    primaryKey({ columns: [table.id], name: 'batches_id' }),
  ],
)

export const blocks = mysqlTable(
  'blocks',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    starting: date({ mode: 'string' }).notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    ending: date({ mode: 'string' }).notNull(),
    duration: varchar({ length: 255 }).notNull(),
    active: tinyint().default(1).notNull(),
    options: json().$type<Record<string, any>>(),
    meta: json().$type<Record<string, any>>(),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'blocks_id' })],
)

export const bookmarks = mysqlTable(
  'bookmarks',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    entityType: varchar('entity_type', { length: 255 }).notNull(),
    entityId: bigint('entity_id', { mode: 'number', unsigned: true }).notNull(),
    isBookmarked: tinyint('is_bookmarked').default(1).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    index('bookmarks_entity_type_entity_id_index').on(
      table.entityType,
      table.entityId,
    ),
    primaryKey({ columns: [table.id], name: 'bookmarks_id' }),
  ],
)

export const clubMembers = mysqlTable(
  'club_members',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clubId: bigint('club_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    role: varchar({ length: 50 }).default('member').notNull(),
    joinedAt: timestamp('joined_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('club_members_club_id_index').on(table.clubId),
    primaryKey({ columns: [table.id], name: 'club_members_id' }),
    unique('club_members_user_id_club_id_unique').on(
      table.userId,
      table.clubId,
    ),
  ],
)

export const clubs = mysqlTable(
  'clubs',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    domain: varchar({ length: 255 }),
    image: text(),
    meta: json().$type<Record<string, any>>(),
    createdBy: bigint('created_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('clubs_created_by_index').on(table.createdBy),
    primaryKey({ columns: [table.id], name: 'clubs_id' }),
  ],
)

export const comments = mysqlTable(
  'comments',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    ticketId: int('ticket_id', { unsigned: true })
      .notNull()
      .references(() => tickets.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    message: text().notNull(),
    data: json().$type<Record<string, any>>(),
    status: varchar({ length: 255 }),
    public: tinyint().default(0).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    index('comments_created_at_index').on(table.createdAt),
    index('comments_updated_at_index').on(table.updatedAt),
    primaryKey({ columns: [table.id], name: 'comments_id' }),
  ],
)

export const discussions = mysqlTable(
  'discussions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    entityType: varchar('entity_type', { length: 255 }).notNull(),
    entityId: bigint('entity_id', { mode: 'number', unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    message: text().notNull(),
    data: json().$type<Record<string, any>>(),
    status: varchar({ length: 255 }),
    isClosed: tinyint('is_closed').default(0).notNull(),
    public: tinyint().default(0).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    assigneeId: bigint('assignee_id', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    gptCentralData: json('gpt_central_data').$type<Record<string, any>>(),
  },
  (table) => [
    index('discussions_created_at_idx').on(table.createdAt),
    index('discussions_entity_type_entity_id_index').on(
      table.entityType,
      table.entityId,
    ),
    primaryKey({ columns: [table.id], name: 'discussions_id' }),
  ],
)

export const eventEnrollments = mysqlTable(
  'event_enrollments',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: bigint('event_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('event_enrollments_event_id_index').on(table.eventId),
    primaryKey({ columns: [table.id], name: 'event_enrollments_id' }),
    unique('event_enrollments_user_id_event_id_unique').on(
      table.userId,
      table.eventId,
    ),
  ],
)

export const events = mysqlTable(
  'events',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    clubId: bigint('club_id', { mode: 'number', unsigned: true }).references(
      () => clubs.id,
      { onDelete: 'cascade' },
    ),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    imageLink: text('image_link'),
    category: varchar({ length: 255 }),
    mode: mysqlEnum(['online', 'offline']),
    locationTitle: varchar('location_title', { length: 255 }),
    locationMapLink: text('location_map_link'),
    eventLink: text('event_link'),
    platform: varchar({ length: 50 }),
    startTime: timestamp('start_time', { mode: 'string' }),
    endTime: timestamp('end_time', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    createdBy: bigint('created_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('events_club_id_index').on(table.clubId),
    index('events_created_by_index').on(table.createdBy),
    primaryKey({ columns: [table.id], name: 'events_id' }),
  ],
)

export const feedback = mysqlTable(
  'feedback',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    variables: json()
      .$type<Record<string, any>>()
      .default(sql`(json_array())`)
      .notNull(),
    settings: json().$type<Record<string, any>>(),
    quizId: int('quiz_id', { unsigned: true }).references(() => quizzes.id),
    feedbackBlueprintId: bigint('feedback_blueprint_id', {
      mode: 'number',
      unsigned: true,
    }).references(() => feedbackBlueprints.id),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    startTime: datetime('start_time', { mode: 'string' }),
    endTime: datetime('end_time', { mode: 'string' }),
  },
  (table) => [
    index('idx_name').on(table.name),
    primaryKey({ columns: [table.id], name: 'feedback_id' }),
  ],
)

export const feedbackBlueprints = mysqlTable(
  'feedback_blueprints',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    variables: json()
      .$type<Record<string, any>>()
      .default(sql`(json_array())`)
      .notNull(),
    settings: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'feedback_blueprints_id' }),
  ],
)

export const helpFaqs = mysqlTable(
  'help_faqs',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    category: varchar({ length: 255 }).notNull(),
    subCategory: varchar('sub_category', { length: 255 }).notNull(),
    question: text().notNull(),
    answer: text().notNull(),
    assignees: json().$type<Record<string, any>>(),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    redirectionToPc: tinyint('redirection_to_pc').default(0).notNull(),
    isHidden: tinyint('is_hidden').default(0).notNull(),
    meta: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    index('help_faqs_category_index').on(table.category),
    index('help_faqs_category_sub_category_index').on(
      table.category,
      table.subCategory,
    ),
    index('help_faqs_is_hidden_index').on(table.isHidden),
    index('help_faqs_sub_category_index').on(table.subCategory),
    primaryKey({ columns: [table.id], name: 'help_faqs_id' }),
  ],
)

export const interviewSessions = mysqlTable(
  'interview_sessions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    topicId: varchar('topic_id', { length: 191 }).notNull(),
    topicLabel: varchar('topic_label', { length: 255 }).notNull(),
    domain: varchar({ length: 50 }).notNull(),
    status: varchar({ length: 20 }).default('in_progress').notNull(),
    turns: json().$type<Array<Record<string, any>>>().notNull(),
    report: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    completedAt: timestamp('completed_at', { mode: 'string' }),
  },
  (table) => [
    index('idx_interview_sessions_user_id').on(table.userId),
    primaryKey({ columns: [table.id], name: 'interview_sessions_id' }),
  ],
)

export const lectureFeedback = mysqlTable(
  'lecture_feedback',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    response: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    feedback: varchar({ length: 191 }),
    rating: int().default(0).notNull(),
  },
  (table) => [
    index('lecture_feedback_lecture_id_foreign').on(table.lectureId),
    primaryKey({ columns: [table.id], name: 'lecture_feedback_id' }),
  ],
)

export const lectureZoomChat = mysqlTable(
  'lecture_zoom_chat',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id),
    meetingId: varchar('meeting_id', { length: 255 }),
    originalChat: json('original_chat').$type<Record<string, any>>().notNull(),
    finalChat: json('final_chat').$type<Record<string, any>>().notNull(),
    lastEditedBy: bigint('last_edited_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'lecture_zoom_chat_id' }),
    unique('lecture_zoom_chat_lecture_id_unique').on(table.lectureId),
  ],
)

export const lectures = mysqlTable(
  'lectures',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    tags: varchar({ length: 255 }),
    description: text(),
    optional: tinyint().default(0).notNull(),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    week: tinyint({ unsigned: true }).notNull(),
    day: tinyint({ unsigned: true }).notNull(),
    schedule: datetime({ mode: 'string' }),
    concludes: datetime({ mode: 'string' }),
    zoomLink: varchar('zoom_link', { length: 255 }),
    notes: text(),
    videos: json().$type<Record<string, any>>(),
    settings: json().$type<Record<string, any>>(),
    data: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    vimeoPlayerEmbedUrl: varchar('vimeo_player_embed_url', { length: 255 }),
    vimeoDownloadLinks: json('vimeo_download_links').$type<
      Record<string, any>
    >(),
    feedbackId: bigint('feedback_id', {
      mode: 'number',
      unsigned: true,
    }).references(() => feedback.id),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startDate: date('start_date', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endDate: date('end_date', { mode: 'string' }),
    startTime: int('start_time'),
    endTime: int('end_time'),
    addToBlueprint: tinyint('add_to_blueprint').default(1).notNull(),
    gptCentralData: json('gpt_central_data').$type<Record<string, any>>(),
    hostId: bigint('host_id', { mode: 'number', unsigned: true }).references(
      () => users.id,
    ),
    feedbackResponseTrousers: json('feedback_response_trousers').$type<
      Record<string, any>
    >(),
    learningObjectives: json('learning_objectives').$type<
      Record<string, any>
    >(),
    module: varchar({ length: 255 }),
    facultyResources: json('faculty_resources').$type<Record<string, any>>(),
    assessments: json().$type<Record<string, any>>(),
    isNewZoomRedirection: tinyint('is_new_zoom_redirection'),
    zoomDetails: json('zoom_details').$type<Record<string, any>>(),
  },
  (table) => [
    index('idx_category').on(table.category),
    index('idx_concludes').on(table.concludes),
    index('idx_schedule').on(table.schedule),
    index('idx_title').on(table.title),
    index('idx_type').on(table.type),
    index('idx_updated_at').on(table.updatedAt),
    primaryKey({ columns: [table.id], name: 'lectures_id' }),
  ],
)

export const lecturesAi = mysqlTable(
  'lectures_ai',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    transcript: longtext(),
    summary: longtext(),
    concepts: json().$type<Record<string, any>>(),
    lectureId: int({ unsigned: true })
      .notNull()
      .references(() => lectures.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    isConceptsPublished: tinyint(),
    isSummaryPublished: tinyint(),
    transcriptSegments: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    lastRefetchTime: datetime({ mode: 'string', fsp: 3 }),
    transcriptId: varchar('transcriptID', { length: 191 }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'lectures_ai_id' }),
    unique('lectures_ai_lectureId_key').on(table.lectureId),
  ],
)

export const loginAttempts = mysqlTable(
  'login_attempts',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    identifier: varchar({ length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    attemptedAt: datetime('attempted_at', { mode: 'string', fsp: 3 }).notNull(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => [
    index('login_attempts_attempted_at_idx').on(table.attemptedAt),
    index('login_attempts_identifier_idx').on(table.identifier),
    index('login_attempts_ip_address_idx').on(table.ipAddress),
    primaryKey({ columns: [table.id], name: 'login_attempts_id' }),
  ],
)

export const masaiverseBanners = mysqlTable(
  'masaiverse_banners',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    ctaText: varchar('cta_text', { length: 255 }),
    ctaUrl: text('cta_url'),
    startDate: timestamp('start_date', { mode: 'string' }),
    endDate: timestamp('end_date', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    createdBy: bigint('created_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    lastEditedBy: bigint('last_edited_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('masaiverse_banners_created_by_index').on(table.createdBy),
    index('masaiverse_banners_last_edited_by_index').on(table.lastEditedBy),
    primaryKey({ columns: [table.id], name: 'masaiverse_banners_id' }),
  ],
)

export const masaiverseLeaderboard = mysqlTable(
  'masaiverse_leaderboard',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdBy: bigint('created_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id, { onDelete: 'set null' }),
    reason: varchar({ length: 50 }).notNull(),
    points: int().notNull(),
    clubId: bigint('club_id', { mode: 'number', unsigned: true }).references(
      () => clubs.id,
      { onDelete: 'set null' },
    ),
    postId: bigint('post_id', { mode: 'number', unsigned: true }).references(
      () => posts.id,
      { onDelete: 'set null' },
    ),
    replyId: bigint('reply_id', { mode: 'number', unsigned: true }).references(
      () => replies.id,
      { onDelete: 'set null' },
    ),
    eventId: bigint('event_id', { mode: 'number', unsigned: true }).references(
      () => events.id,
      { onDelete: 'set null' },
    ),
    meta: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('masaiverse_leaderboard_club_id_index').on(table.clubId),
    index('masaiverse_leaderboard_created_by_index').on(table.createdBy),
    index('masaiverse_leaderboard_event_id_index').on(table.eventId),
    index('masaiverse_leaderboard_post_id_index').on(table.postId),
    index('masaiverse_leaderboard_reason_index').on(table.reason),
    index('masaiverse_leaderboard_reply_id_index').on(table.replyId),
    index('masaiverse_leaderboard_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'masaiverse_leaderboard_id' }),
  ],
)

export const menus = mysqlTable(
  'menus',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    category: varchar({ length: 255 }).notNull(),
    value: varchar({ length: 255 }).notNull(),
    ordering: mediumint().notNull(),
    data: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deprecated: tinyint().default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'menus_id' })],
)

export const messages = mysqlTable(
  'messages',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    subject: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    authorId: bigint('author_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    priority: varchar({ length: 255 }),
    readAt: datetime('read_at', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    messageId: bigint('message_id', { mode: 'number', unsigned: true }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    ctaLink: varchar('cta_link', { length: 255 }),
    ctaName: varchar('cta_name', { length: 255 }),
    showAsPopup: tinyint('show_as_popup').default(0).notNull(),
    concludes: datetime({ mode: 'string' }),
    schedule: datetime({ mode: 'string' }),
  },
  (table) => [
    index('messages_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [table.id],
      name: 'messages_message_id_foreign',
    }),
    primaryKey({ columns: [table.id], name: 'messages_id' }),
  ],
)

export const notificationLogs = mysqlTable(
  'notification_logs',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    notificationType: varchar('notification_type', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: int('entity_id', { unsigned: true }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    data: json().$type<Record<string, any>>(),
    status: varchar({ length: 50 }).notNull(),
    sentAt: timestamp('sent_at', { mode: 'string' }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('notification_logs_entity_index').on(
      table.entityType,
      table.entityId,
    ),
    index('notification_logs_sent_at_index').on(table.sentAt),
    index('notification_logs_status_index').on(table.status),
    index('notification_logs_type_index').on(table.notificationType),
    index('notification_logs_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'notification_logs_id' }),
    unique('notification_logs_unique_notification').on(
      table.userId,
      table.notificationType,
      table.entityId,
    ),
  ],
)

export const optInChoices = mysqlTable(
  'opt_in_choices',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    sectionId: int('section_id', { unsigned: true })
      .notNull()
      .references(() => sections.id),
    trackName: varchar('track_name', { length: 255 }).notNull(),
    trackDescription: varchar('track_description', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'opt_in_choices_id' })],
)

export const otpCodes = mysqlTable(
  'otp_codes',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    sessionId: varchar('session_id', { length: 36 }).notNull(),
    identifier: varchar({ length: 255 }).notNull(),
    channel: varchar({ length: 20 }).notNull(),
    otpHash: varchar('otp_hash', { length: 255 }).notNull(),
    expiresAt: datetime('expires_at', { mode: 'string', fsp: 3 }).notNull(),
    attempts: int().default(0).notNull(),
    usedAt: datetime('used_at', { mode: 'string', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
  },
  (table) => [
    index('otp_codes_identifier_idx').on(table.identifier),
    primaryKey({ columns: [table.id], name: 'otp_codes_id' }),
    unique('otp_codes_session_id_key').on(table.sessionId),
  ],
)

export const posts = mysqlTable(
  'posts',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    clubId: bigint('club_id', { mode: 'number', unsigned: true }).references(
      () => clubs.id,
      { onDelete: 'cascade' },
    ),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    title: text(),
    content: text(),
    isBanned: tinyint('is_banned').default(0).notNull(),
    bannedBy: bigint('banned_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id, { onDelete: 'set null' }),
    bannedDate: timestamp('banned_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('posts_banned_by_index').on(table.bannedBy),
    index('posts_club_id_index').on(table.clubId),
    index('posts_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'posts_id' }),
  ],
)

export const problems = mysqlTable(
  'problems',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    statement: text().notNull(),
    category: varchar({ length: 255 }).notNull(),
    topic: varchar({ length: 255 }).notNull(),
    tags: varchar({ length: 255 }),
    description: text(),
    approach: text(),
    rubrics: text(),
    type: mysqlEnum(['LINK', 'FILE', 'BUTTON']).default('LINK').notNull(),
    submissionProof: tinyint('submission_proof').default(0).notNull(),
    submissionInstructions: text('submission_instructions'),
    marks: tinyint({ unsigned: true }).default(1).notNull(),
    timing: smallint({ unsigned: true }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    options: json().$type<Record<string, any>>(),
    meta: json().$type<Record<string, any>>(),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'problems_id' })],
)

export const profiles = mysqlTable(
  'profiles',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    birthDate: date('birth_date', { mode: 'string' }),
    gender: mysqlEnum(['MALE', 'FEMALE', 'OTHER']).default('OTHER').notNull(),
    education: json().$type<Record<string, any>>(),
    experience: json().$type<Record<string, any>>(),
    family: json().$type<Record<string, any>>(),
    finance: json().$type<Record<string, any>>(),
    isa: json().$type<Record<string, any>>(),
    socialMedia: json('social_media').$type<Record<string, any>>(),
    meta: json().$type<Record<string, any>>(),
    info: json().$type<Record<string, any>>(),
    data: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    isaStatus: varchar('isa_status', { length: 255 }),
    isaSigningTime: timestamp('isa_signing_time', { mode: 'string' }),
    graduationTime: timestamp('graduation_time', { mode: 'string' }),
    placementTime: timestamp('placement_time', { mode: 'string' }),
    dropoutTime: timestamp('dropout_time', { mode: 'string' }),
    placement: json().$type<Record<string, any>>(),
    address: json().$type<Record<string, any>>(),
    placementStatus: varchar('placement_status', { length: 255 }),
    placementSubStatus: varchar('placement_sub_status', { length: 255 }),
    secondaryEmail: varchar('secondary_email', { length: 255 }),
    secondaryMobile: varchar('secondary_mobile', { length: 255 }),
    documents: json().$type<Record<string, any>>(),
    declaration: json().$type<Record<string, any>>(),
    stage: varchar({ length: 255 }),
    disbursalStatus: varchar('disbursal_status', { length: 255 }),
    resumeBuilderId: varchar('resume_builder_id', { length: 255 }),
    personalInfo: json('personal_info').$type<Record<string, any>>(),
    haveAcceptedLegalAggrement: tinyint(),
    haveClosedModal: int({ unsigned: true }),
    legalData: json('legal_data').$type<Record<string, any>>(),
    slackId: varchar('slack_id', { length: 255 }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'profiles_id' })],
)

export const quizzes = mysqlTable(
  'quizzes',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    title: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    tags: varchar({ length: 255 }),
    instructions: text(),
    optional: tinyint().default(0).notNull(),
    batchId: int('batch_id', { unsigned: true }).references(() => batches.id),
    sectionId: int('section_id', { unsigned: true }).references(
      () => sections.id,
    ),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    week: tinyint({ unsigned: true }).notNull(),
    day: tinyint({ unsigned: true }).notNull(),
    shuffle: tinyint().default(0).notNull(),
    timeLimit: mediumint('time_limit', { unsigned: true }).notNull(),
    showAnswers: tinyint('show_answers').default(0).notNull(),
    showScores: tinyint('show_scores').default(0).notNull(),
    schedule: datetime({ mode: 'string' }),
    concludes: datetime({ mode: 'string' }),
    settings: json().$type<Record<string, any>>(),
    data: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    startDate: date('start_date', { mode: 'string' }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    endDate: date('end_date', { mode: 'string' }),
    startTime: int('start_time'),
    endTime: int('end_time'),
    addToBlueprint: tinyint('add_to_blueprint').default(1).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'quizzes_id' })],
)

export const replies = mysqlTable(
  'replies',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    postId: bigint('post_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    content: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('replies_post_id_index').on(table.postId),
    index('replies_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'replies_id' }),
  ],
)

export const sectionUser = mysqlTable(
  'section_user',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    sectionId: int('section_id', { unsigned: true })
      .notNull()
      .references(() => sections.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    managerId: bigint('manager_id', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    role: varchar({ length: 255 }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    currentAsyncCount: int('current_async_count').default(0).notNull(),
    optInChoiceId: bigint('opt_in_choice_id', {
      mode: 'number',
      unsigned: true,
    }).references(() => optInChoices.id),
    permitted: tinyint(),
    suspectList: tinyint('suspect_list').default(0).notNull(),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('idx_role').on(table.role),
    primaryKey({ columns: [table.id], name: 'section_user_id' }),
  ],
)

export const sections = mysqlTable(
  'sections',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    active: tinyint().default(1).notNull(),
    type: varchar({ length: 255 }).notNull(),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    settings: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    blockId: int('block_id', { unsigned: true }).references(() => blocks.id),
    assignmentPercentageWeightage: double('assignment_percentage_weightage', {
      precision: 8,
      scale: 2,
    }).notNull(),
    attendancePercentageWeightage: double('attendance_percentage_weightage', {
      precision: 8,
      scale: 2,
    }).notNull(),
    optInStartDatetime: timestamp('opt_in_start_datetime', { mode: 'string' }),
    optInEndDatetime: timestamp('opt_in_end_datetime', { mode: 'string' }),
    dayBlock: varchar('day_block', { length: 255 }),
    startTime: int('start_time'),
    endTime: int('end_time'),
    level: double({ precision: 8, scale: 2 }),
    courseType: varchar('course_type', { length: 255 }),
    unitMovementCompleted: tinyint('unit_movement_completed')
      .default(0)
      .notNull(),
    module: varchar({ length: 255 }),
  },
  (table) => [
    index('idx_name').on(table.name),
    primaryKey({ columns: [table.id], name: 'sections_id' }),
  ],
)

export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar({ length: 255 }).notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    payload: text().notNull(),
    lastActivity: int('last_activity').notNull(),
  },
  (table) => [
    index('sessions_last_activity_index').on(table.lastActivity),
    index('sessions_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'sessions_id' }),
  ],
)

export const solutions = mysqlTable(
  'solutions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    submissionId: int('submission_id', { unsigned: true })
      .notNull()
      .references(() => submissions.id),
    problemId: int('problem_id', { unsigned: true })
      .notNull()
      .references(() => problems.id),
    submissionLink: text('submission_link').notNull(),
    submissionProofLink: text('submission_proof_link'),
    feedback: json().$type<Record<string, any>>(),
    data: json().$type<Record<string, any>>(),
    score: tinyint({ unsigned: true }).default(0).notNull(),
    startedAt: datetime('started_at', { mode: 'string' }),
    submittedAt: datetime('submitted_at', { mode: 'string' }),
    status: varchar({ length: 255 }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'solutions_id' })],
)

export const studentAttendances = mysqlTable(
  'student_attendances',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true }).references(
      () => users.id,
    ),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id),
    schedule: datetime({ mode: 'string' }).notNull(),
    sectionId: int('section_id', { unsigned: true })
      .notNull()
      .references(() => sections.id),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    livePercentage: tinyint('live_percentage').default(0).notNull(),
    liveAttendanceStatus: tinyint('live_attendance_status')
      .default(0)
      .notNull(),
    joinedLate: tinyint('joined_late').default(0).notNull(),
    lateByMinutes: int('late_by_minutes', { unsigned: true }),
    videoPercentage: tinyint('video_percentage').default(0).notNull(),
    videoAttendanceStatus: tinyint('video_attendance_status')
      .default(0)
      .notNull(),
    videoLastUpdatedAt: timestamp('video_last_updated_at', { mode: 'string' }),
    includeVideoAttendance: tinyint('include_video_attendance')
      .default(0)
      .notNull(),
    catchUpDays: int('catch_up_days', { unsigned: true }),
    status: tinyint().default(0).notNull(),
    meta: json().$type<Record<string, any>>(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('student_attendances_batch_id_index').on(table.batchId),
    index('student_attendances_lecture_id_index').on(table.lectureId),
    index('student_attendances_schedule_index').on(table.schedule),
    index('student_attendances_section_id_schedule_index').on(
      table.sectionId,
      table.schedule,
    ),
    index('student_attendances_status_index').on(table.status),
    index('student_attendances_user_id_schedule_index').on(
      table.userId,
      table.schedule,
    ),
    primaryKey({ columns: [table.id], name: 'student_attendances_id' }),
    unique('student_attendances_lecture_id_user_id_unique').on(
      table.lectureId,
      table.userId,
    ),
  ],
)

export const submissions = mysqlTable(
  'submissions',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    assignmentId: int('assignment_id', { unsigned: true })
      .notNull()
      .references(() => assignments.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    score: double().notNull(),
    startedAt: timestamp('started_at', { mode: 'string' }),
    completedAt: timestamp('completed_at', { mode: 'string' }),
    data: json().$type<Record<string, any>>(),
    problems: json().$type<Record<string, any>>(),
    started: tinyint().default(0).notNull(),
    completed: tinyint().default(0).notNull(),
    status: varchar({ length: 255 }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    markAsCompleted: tinyint('mark_as_completed'),
    oldScore: double('old_score').notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'submissions_id' })],
)

export const threads = mysqlTable(
  'threads',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    discussionId: int('discussion_id', { unsigned: true })
      .notNull()
      .references(() => discussions.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    message: text().notNull(),
    data: json().$type<Record<string, any>>(),
    status: varchar({ length: 255 }),
    public: tinyint().default(0).notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    readAt: timestamp('read_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'threads_id' })],
)

export const tickets = mysqlTable(
  'tickets',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    title: text().notNull(),
    message: text().notNull(),
    data: json().$type<Record<string, any>>(),
    status: varchar({ length: 255 }),
    department: varchar({ length: 255 }),
    priority: varchar({ length: 255 }),
    isClosed: tinyint('is_closed').default(0).notNull(),
    assigneeId: bigint('assignee_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    closedAt: datetime('closed_at', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    category: varchar({ length: 255 }).notNull(),
    agentId: bigint('agent_id', { mode: 'number', unsigned: true }).references(
      () => users.id,
    ),
    rating: int({ unsigned: true }).default(0).notNull(),
    info: json().$type<Record<string, any>>(),
    logstamps: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('tickets_closed_at_index').on(table.closedAt),
    index('tickets_created_at_index').on(table.createdAt),
    index('tickets_updated_at_index').on(table.updatedAt),
    primaryKey({ columns: [table.id], name: 'tickets_id' }),
  ],
)

export const userBadges = mysqlTable(
  'user_badges',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    badgeId: int('badge_id', { unsigned: true })
      .notNull()
      .references(() => badges.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    badgeConfigId: int('badge_config_id', { unsigned: true })
      .notNull()
      .references(() => badgeConfigs.id),
    badgeConfigSnapshot: json('badge_config_snapshot').$type<
      Record<string, any>
    >(),
    createdBy: bigint('created_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    releaseDate: date('release_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'user_badges_id' }),
    unique('user_badges_user_badge_config_unique').on(
      table.userId,
      table.badgeId,
      table.badgeConfigId,
    ),
  ],
)

export const userBatchAdmissionData = mysqlTable(
  'user_batch_admission_data',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    idCardUrl: varchar('id_card_url', { length: 500 }),
    seatBlockingFeesPaid: tinyint('seat_blocking_fees_paid')
      .default(0)
      .notNull(),
    seatBlockingFeesAmount: decimal('seat_blocking_fees_amount', {
      precision: 10,
      scale: 2,
    }),
    seatBlockingFeesPaidDate: datetime('seat_blocking_fees_paid_date', {
      mode: 'string',
    }),
    seatBlockingFeesInvoice: varchar('seat_blocking_fees_invoice', {
      length: 500,
    }),
    fullFeesPaid: tinyint('full_fees_paid').default(0).notNull(),
    fullFeesAmount: decimal('full_fees_amount', { precision: 10, scale: 2 }),
    fullFeesPaidDate: datetime('full_fees_paid_date', { mode: 'string' }),
    fullFeesPaidInvoice: varchar('full_fees_paid_invoice', { length: 500 }),
    studentKitExists: tinyint('student_kit_exists').default(0).notNull(),
    studentKitDetailsFilled: tinyint('student_kit_details_filled')
      .default(0)
      .notNull(),
    studentKitTrackingUrl: varchar('student_kit_tracking_url', { length: 500 }),
    courseFeeDeadline: datetime('course_fee_deadline', { mode: 'string' }),
    lmsAccessDate: datetime('lms_access_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    paymentUrl: varchar('payment_url', { length: 500 }),
    meta: json().$type<Record<string, any>>(),
  },
  (table) => [
    index('user_batch_admission_data_batch_id_index').on(table.batchId),
    index('user_batch_admission_data_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'user_batch_admission_data_id' }),
    unique('user_batch_admission_data_user_id_batch_id_unique').on(
      table.userId,
      table.batchId,
    ),
  ],
)

export const userCallbackTickets = mysqlTable(
  'user_callback_tickets',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    resolvedBy: bigint('resolved_by', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    batchId: int('batch_id', { unsigned: true })
      .notNull()
      .references(() => batches.id),
    category: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 255 }).default('pending').notNull(),
    meta: json().$type<Record<string, any>>(),
    assignedTo: bigint('assigned_to', {
      mode: 'number',
      unsigned: true,
    }).references(() => users.id),
    preferredTimeSlot: varchar('preferred_time_slot', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    adminComment: text('admin_comment'),
    commentUpdatedAt: timestamp('comment_updated_at', { mode: 'string' }),
    logs: json().$type<Record<string, any>>(),
    resolvedAt: timestamp('resolved_at', { mode: 'string' }),
  },
  (table) => [
    index('user_callback_tickets_status_index').on(table.status),
    primaryKey({ columns: [table.id], name: 'user_callback_tickets_id' }),
  ],
)

export const userDeviceTokens = mysqlTable(
  'user_device_tokens',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar({ length: 255 }).notNull(),
    deviceType: varchar('device_type', { length: 50 }),
    deviceName: varchar('device_name', { length: 255 }),
    active: tinyint().default(1).notNull(),
    lastUsed: timestamp('last_used', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('user_device_tokens_active_index').on(table.active),
    index('user_device_tokens_token_index').on(table.token),
    index('user_device_tokens_user_id_index').on(table.userId),
    primaryKey({ columns: [table.id], name: 'user_device_tokens_id' }),
    unique('user_device_tokens_user_id_token_unique').on(
      table.userId,
      table.token,
    ),
  ],
)

export const users = mysqlTable(
  'users',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { mode: 'string' }),
    password: varchar({ length: 255 }).notNull(),
    twoFactorSecret: text('two_factor_secret'),
    twoFactorRecoveryCodes: text('two_factor_recovery_codes'),
    rememberToken: varchar('remember_token', { length: 100 }),
    currentTeamId: bigint('current_team_id', {
      mode: 'number',
      unsigned: true,
    }),
    profilePhotoPath: varchar('profile_photo_path', { length: 2048 }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    role: varchar({ length: 255 }),
    mobile: varchar({ length: 255 }),
    title: varchar({ length: 255 }),
    status: varchar({ length: 255 }),
    username: varchar({ length: 255 }),
    lastActiveAt: timestamp('last_active_at', { mode: 'string' }),
    statusTime: datetime('status_time', { mode: 'string' }),
    meta: json().$type<Record<string, any>>(),
    client: varchar({ length: 20 }).default('masai').notNull(),
  },
  (table) => [
    index('idx_name').on(table.name),
    primaryKey({ columns: [table.id], name: 'users_id' }),
    unique('users_email_client_unique').on(table.email, table.client),
    unique('users_username_unique').on(table.username),
  ],
)

export const videoAttendances = mysqlTable(
  'video_attendances',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    lectureId: int('lecture_id', { unsigned: true })
      .notNull()
      .references(() => lectures.id),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    hostId: bigint('host_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id),
    category: varchar({ length: 255 }).notNull(),
    duration: int().notNull(),
    batchId: int('batch_id').notNull(),
    sectionId: int('section_id').notNull(),
    type: varchar({ length: 255 }).notNull(),
    status: int().notNull(),
    schedule: datetime({ mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    intervals: json().$type<Record<string, any>>(),
    totalDuration: int(),
    data: json().$type<Record<string, any>>(),
    sessionToken: varchar({ length: 191 }),
  },
  (table) => [
    index('idx_video_att_batch_lecture').on(table.batchId, table.lectureId),
    index('idx_video_att_created').on(table.createdAt),
    index('idx_video_att_user_lecture').on(table.userId, table.lectureId),
    primaryKey({ columns: [table.id], name: 'video_attendances_id' }),
  ],
)

export const votes = mysqlTable(
  'votes',
  {
    id: bigint({ mode: 'number', unsigned: true }).autoincrement().notNull(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: bigint('post_id', { mode: 'number', unsigned: true }).references(
      () => posts.id,
      { onDelete: 'cascade' },
    ),
    replyId: bigint('reply_id', { mode: 'number', unsigned: true }).references(
      () => replies.id,
      { onDelete: 'cascade' },
    ),
    vote: mysqlEnum(['upvote', 'downvote']).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
    voteTarget: varchar('vote_target', { length: 73 })
      .default(
        sql`((case when (\`post_id\` is not null) then concat(_utf8mb4\'p:\',\`post_id\`) else concat(_utf8mb4\'r:\',\`reply_id\`) end))`,
      )
      .notNull(),
  },
  (table) => [
    index('votes_post_id_index').on(table.postId),
    index('votes_reply_id_index').on(table.replyId),
    primaryKey({ columns: [table.id], name: 'votes_id' }),
    unique('votes_user_id_vote_target_unique').on(
      table.userId,
      table.voteTarget,
    ),
  ],
)

export const whatsnew = mysqlTable(
  'whatsnew',
  {
    id: int({ unsigned: true }).autoincrement().notNull(),
    subject: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    image: varchar({ length: 255 }),
    createdAt: timestamp('created_at', { mode: 'string' }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'whatsnew_id' })],
)
