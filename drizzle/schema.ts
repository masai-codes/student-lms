import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, varchar, datetime, text, int, index, foreignKey, bigint, longtext, timestamp, date, json, tinyint, unique, mysqlEnum, time, smallint, double, char, decimal, mediumint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const prismaMigrations = mysqlTable("_prisma_migrations", {
	id: varchar({ length: 36 }).notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: datetime("finished_at", { mode: 'string', fsp: 3 }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: datetime("rolled_back_at", { mode: 'string', fsp: 3 }),
	startedAt: datetime("started_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
	appliedStepsCount: int("applied_steps_count", { unsigned: true }).default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "_prisma_migrations_id"}),
]);

export const accessLogs = mysqlTable("access_logs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	username: varchar({ length: 255 }).notNull(),
	userEmail: varchar("user_email", { length: 255 }).notNull(),
	routeName: varchar("route_name", { length: 255 }).notNull(),
	routeAction: varchar("route_action", { length: 255 }).notNull(),
	routePath: varchar("route_path", { length: 255 }).notNull(),
	requestContent: longtext("request_content").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("access_logs_created_at_index").on(table.createdAt),
	index("access_logs_route_action_index").on(table.routeAction),
	index("access_logs_route_name_index").on(table.routeName),
	index("access_logs_route_path_index").on(table.routePath),
	index("access_logs_user_email_index").on(table.userEmail),
	index("access_logs_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "access_logs_id"}),
]);

export const adhocSessionApprovers = mysqlTable("adhoc_session_approvers", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	adhocSessionId: int("adhoc_session_id", { unsigned: true }).notNull().references(() => adhocSessions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	approved: tinyint(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_approvers_id"}),
]);

export const adhocSessionBatches = mysqlTable("adhoc_session_batches", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	adhocSessionId: int("adhoc_session_id", { unsigned: true }).notNull().references(() => adhocSessions.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_batches_id"}),
]);

export const adhocSessionBlocks = mysqlTable("adhoc_session_blocks", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	adhocSessionId: int("adhoc_session_id", { unsigned: true }).notNull().references(() => adhocSessions.id),
	blockId: int("block_id", { unsigned: true }).notNull().references(() => blocks.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_blocks_id"}),
]);

export const adhocSessionBlueprints = mysqlTable("adhoc_session_blueprints", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	priority: int().default(0).notNull(),
	blockCount: int("block_count"),
	batchCount: int("batch_count"),
	sectionCount: int("section_count"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_blueprints_id"}),
]);

export const adhocSessionSections = mysqlTable("adhoc_session_sections", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	adhocSessionId: int("adhoc_session_id", { unsigned: true }).notNull().references(() => adhocSessions.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_sections_id"}),
]);

export const adhocSessionUsers = mysqlTable("adhoc_session_users", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	adhocSessionId: int("adhoc_session_id", { unsigned: true }).notNull().references(() => adhocSessions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_session_users_id"}),
]);

export const adhocSessions = mysqlTable("adhoc_sessions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	url: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	startTime: int("start_time").notNull(),
	endTime: int("end_time").notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	priority: int().default(0).notNull(),
	approved: tinyint(),
	approvalNotes: varchar("approval_notes", { length: 255 }),
	cancelled: tinyint().default(0).notNull(),
	cancellationNotes: varchar("cancellation_notes", { length: 255 }),
	adhocSessionBlueprintId: int("adhoc_session_blueprint_id", { unsigned: true }).references(() => adhocSessionBlueprints.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "adhoc_sessions_id"}),
]);

export const aiChatPracticeQuestions = mysqlTable("ai_chat_practice_questions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int({ unsigned: true }).notNull().references(() => lectures.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	userId: bigint({ mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	chatHistory: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	rating: int(),
	feedback: varchar({ length: 191 }),
	feedbackTime: timestamp("feedback_time", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ai_chat_practice_questions_id"}),
]);

export const aiFeedback = mysqlTable("ai_feedback", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	rating: int({ unsigned: true }).notNull(),
	userId: bigint({ mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	type: varchar({ length: 191 }).notNull(),
	lectureId: int({ unsigned: true }).notNull().references(() => lectures.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	feedback: varchar({ length: 191 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ai_feedback_id"}),
]);

export const aiPracticeQuestions = mysqlTable("ai_practice_questions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int({ unsigned: true }).notNull().references(() => lectures.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	userId: bigint({ mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	question: text().notNull(),
	options: json().notNull(),
	correctOption: int({ unsigned: true }).notNull(),
	selectedOption: int({ unsigned: true }),
	explanation: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ai_practice_questions_id"}),
]);

export const aiTutorSessions = mysqlTable("ai_tutor_sessions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	uniqueId: varchar("unique_id", { length: 255 }).notNull(),
	sessionId: varchar("session_id", { length: 255 }),
	roomName: varchar("room_name", { length: 255 }),
	token: text(),
	websocketUrl: varchar("websocket_url", { length: 500 }),
	language: varchar({ length: 50 }),
	durationMinutes: int("duration_minutes"),
	participantName: varchar("participant_name", { length: 255 }),
	errorMessage: text("error_message"),
	rating: tinyint({ unsigned: true }),
	feedback: text(),
	feedbackAt: timestamp("feedback_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("ai_tutor_sessions_user_id_index").on(table.userId),
	index("ai_tutor_sessions_lecture_id_index").on(table.lectureId),
	index("ai_tutor_sessions_created_at_index").on(table.createdAt),
	index("ai_tutor_sessions_unique_id_index").on(table.uniqueId),
	primaryKey({ columns: [table.id], name: "ai_tutor_sessions_id"}),
]);

export const algorithms = mysqlTable("algorithms", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "algorithms_id"}),
]);

export const announcements = mysqlTable("announcements", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	type: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	optional: tinyint().default(0).notNull(),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: tinyint({ unsigned: true }).notNull(),
	day: tinyint({ unsigned: true }).notNull(),
	schedule: datetime({ mode: 'string'}),
	concludes: datetime({ mode: 'string'}),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "announcements_id"}),
]);

export const answers = mysqlTable("answers", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	attemptId: int("attempt_id", { unsigned: true }).notNull().references(() => attempts.id),
	questionId: int("question_id", { unsigned: true }).notNull().references(() => questions.id),
	answer: text(),
	data: json(),
	feedback: json(),
	score: tinyint({ unsigned: true }).default(0).notNull(),
	startedAt: datetime("started_at", { mode: 'string'}),
	submittedAt: datetime("submitted_at", { mode: 'string'}),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "answers_id"}),
]);

export const appConfigs = mysqlTable("app_configs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	appName: varchar({ length: 100 }).notNull(),
	platform: mysqlEnum(['android','ios','web']).notNull(),
	minRequiredVersion: varchar({ length: 20 }).notNull(),
	latestVersion: varchar({ length: 20 }).notNull(),
	forceUpdate: tinyint().default(0).notNull(),
	updateMessage: varchar({ length: 500 }),
	storeUrl: varchar({ length: 500 }).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("app_configs_appName_index").on(table.appName),
	index("app_configs_platform_index").on(table.platform),
	index("app_configs_isActive_index").on(table.isActive),
	primaryKey({ columns: [table.id], name: "app_configs_id"}),
	unique("app_configs_appName_platform_unique").on(table.appName, table.platform),
]);

export const applicationComments = mysqlTable("application_comments", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	applicationId: bigint("application_id", { mode: "number", unsigned: true }).notNull().references(() => applications.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	comment: text(),
	tags: json(),
	data: json(),
	info: json(),
	read: tinyint().default(0).notNull(),
	readAt: datetime("read_at", { mode: 'string'}),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "application_comments_id"}),
]);

export const applicationHistories = mysqlTable("application_histories", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	applicationId: bigint("application_id", { mode: "number", unsigned: true }).notNull().references(() => applications.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	oldStatus: varchar("old_status", { length: 255 }),
	newStatus: varchar("new_status", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "application_histories_id"}),
]);

export const applications = mysqlTable("applications", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	status: varchar({ length: 255 }),
	round: varchar({ length: 255 }),
	studentPreference: varchar("student_preference", { length: 255 }),
	studentPreferenceReason: text("student_preference_reason"),
	visible: tinyint(),
	positionId: bigint("position_id", { mode: "number", unsigned: true }).notNull().references(() => positions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	offerLetterSharedAt: datetime("offer_letter_shared_at", { mode: 'string'}),
	verbalOfferSharedAt: datetime("verbal_offer_shared_at", { mode: 'string'}),
	offerLetterSentToOpsAt: datetime("offer_letter_sent_to_ops_at", { mode: 'string'}),
	data: json(),
	info: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	set: int(),
},
(table) => [
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "applications_id"}),
]);

export const assignmentBlueprints = mysqlTable("assignment_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	instructions: text(),
	optional: tinyint().notNull(),
	blueprintId: bigint("blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => blueprints.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: int().notNull(),
	day: varchar({ length: 255 }).notNull(),
	showScores: tinyint("show_scores").notNull(),
	settings: json(),
	data: json(),
	buckets: json(),
	weightage: int().notNull(),
	visible: tinyint().notNull(),
	assignmentId: int("assignment_id", { unsigned: true }).references(() => assignments.id, { onDelete: "cascade" } ),
	scheduledTime: time("scheduled_time"),
	concludesTime: time("concludes_time"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "assignment_blueprints_id"}),
]);

export const assignmentBlueprintsProblems = mysqlTable("assignment_blueprints_problems", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	assignmentBlueprintId: bigint("assignment_blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => assignmentBlueprints.id, { onDelete: "cascade" } ),
	problemId: int("problem_id", { unsigned: true }).notNull().references(() => problems.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "assignment_blueprints_problems_id"}),
]);

export const assignmentProblem = mysqlTable("assignment_problem", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	assignmentId: int("assignment_id", { unsigned: true }).notNull().references(() => assignments.id),
	problemId: int("problem_id", { unsigned: true }).notNull().references(() => problems.id),
	priority: tinyint({ unsigned: true }).default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "assignment_problem_id"}),
]);

export const assignments = mysqlTable("assignments", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	module: varchar({ length: 255 }),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	instructions: text(),
	optional: tinyint().default(0).notNull(),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: tinyint({ unsigned: true }).notNull(),
	day: tinyint({ unsigned: true }).notNull(),
	showScores: tinyint("show_scores").default(0).notNull(),
	schedule: datetime({ mode: 'string'}),
	concludes: datetime({ mode: 'string'}),
	settings: json(),
	data: json(),
	buckets: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	weightage: int().default(0).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	startTime: int("start_time"),
	endTime: int("end_time"),
	addToBlueprint: tinyint("add_to_blueprint").default(1).notNull(),
	enforceDeadline: tinyint("enforce_deadline").default(1),
	showSubmission: tinyint("show_submission").default(0).notNull(),
	getsRemainingTime: tinyint("gets_remaining_time").default(0).notNull(),
	allowPractice: tinyint("allow_practice").default(0).notNull(),
	platform: varchar({ length: 191 }),
	learningObjectives: json("learning_objectives"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "assignments_id"}),
]);

export const attempts = mysqlTable("attempts", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	quizId: int("quiz_id", { unsigned: true }).notNull().references(() => quizzes.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	attempt: smallint({ unsigned: true }).notNull(),
	correct: smallint({ unsigned: true }).notNull(),
	wrong: smallint({ unsigned: true }).notNull(),
	skipped: smallint({ unsigned: true }).notNull(),
	partial: smallint({ unsigned: true }).notNull(),
	score: smallint({ unsigned: true }).notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	data: json(),
	questions: json(),
	started: tinyint().default(0).notNull(),
	completed: tinyint().default(0).notNull(),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "attempts_id"}),
]);

export const attendances = mysqlTable("attendances", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
	hostId: bigint("host_id", { mode: "number", unsigned: true }).references(() => users.id),
	category: varchar({ length: 255 }).notNull(),
	duration: int().notNull(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	type: varchar({ length: 255 }).notNull(),
	status: int().notNull(),
	joinedLate: tinyint("joined_late").default(0).notNull(),
	lateByMinutes: int("late_by_minutes", { unsigned: true }),
	schedule: datetime({ mode: 'string'}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("attendances_lecture_id_index").on(table.lectureId),
	index("attendances_user_id_index").on(table.userId),
	index("attendances_section_id_index").on(table.sectionId),
	index("attendances_batch_id_index").on(table.batchId),
	primaryKey({ columns: [table.id], name: "attendances_id"}),
	unique("attendances_lecture_id_user_id_key").on(table.lectureId, table.userId),
]);

export const badgeConfigs = mysqlTable("badge_configs", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	badgeId: int("badge_id", { unsigned: true }).notNull().references(() => badges.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	lectureCriteria: mysqlEnum("lecture_criteria", ['none','mandatory','recommended','both']).default('none').notNull(),
	lectureCriteriaPercentage: double("lecture_criteria_percentage"),
	assignmentCriteria: mysqlEnum("assignment_criteria", ['none','mandatory','recommended','both']).default('none').notNull(),
	assignmentSubmissionCriteriaPercentage: double("assignment_submission_criteria_percentage"),
	assignmentScoreCriteriaPercentage: double("assignment_score_criteria_percentage"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	assignmentTypesCriteria: json("assignment_types_criteria"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "badge_configs_id"}),
	unique("badge_configs_badge_id_section_id_unique").on(table.badgeId, table.sectionId),
]);

export const badges = mysqlTable("badges", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	image: varchar({ length: 2048 }).notNull(),
	linkedinShareText: text("linkedin_share_text"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	lockedBadgeDescription: text("locked_badge_description"),
	theme: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "badges_id"}),
]);

export const banners = mysqlTable("banners", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	variant: varchar({ length: 100 }).notNull(),
	groupName: varchar("group_name", { length: 150 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	ctaUrl: varchar("cta_url", { length: 500 }).notNull(),
	visibleTo: json("visible_to").notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	startDate: datetime("start_date", { mode: 'string'}),
	endDate: datetime("end_date", { mode: 'string'}),
	data: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("idx_banners_type").on(table.type),
	index("idx_banners_variant").on(table.variant),
	index("idx_banners_group_name").on(table.groupName),
	index("idx_banners_is_active").on(table.isActive),
	primaryKey({ columns: [table.id], name: "banners_id"}),
	unique("banners_group_name_key").on(table.groupName),
]);

export const batchInfo = mysqlTable("batch_info", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	item: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	value: text(),
	makerId: bigint("maker_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	checkerId: bigint("checker_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	meta: json(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	team: varchar({ length: 50 }),
	stageId: bigint("stage_id", { mode: "number", unsigned: true }).notNull().references(() => batchInfoStages.id, { onDelete: "cascade" } ),
	description: text(),
},
(table) => [
	index("batch_info_batch_id_idx").on(table.batchId),
	index("batch_info_type_idx").on(table.type),
	index("batch_info_maker_id_idx").on(table.makerId),
	index("batch_info_checker_id_idx").on(table.checkerId),
	index("batch_info_status_idx").on(table.status),
	index("batch_info_stage_id_idx").on(table.stageId),
	primaryKey({ columns: [table.id], name: "batch_info_id"}),
]);

export const batchInfoApprovers = mysqlTable("batch_info_approvers", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	stageId: bigint("stage_id", { mode: "number", unsigned: true }).notNull().references(() => batchInfoStages.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("batch_info_approvers_stage_id_idx").on(table.stageId),
	index("batch_info_approvers_user_id_idx").on(table.userId),
	index("batch_info_approvers_status_idx").on(table.status),
	primaryKey({ columns: [table.id], name: "batch_info_approvers_id"}),
	unique("batch_info_approvers_stage_user_unique").on(table.stageId, table.userId),
]);

export const batchInfoHistory = mysqlTable("batch_info_history", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	entityName: varchar("entity_name", { length: 255 }).notNull(),
	eventName: varchar("event_name", { length: 50 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	username: varchar({ length: 255 }).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("batch_info_history_batch_id_idx").on(table.batchId),
	index("batch_info_history_entity_id_idx").on(table.entityId),
	index("batch_info_history_user_id_idx").on(table.userId),
	index("batch_info_history_event_name_idx").on(table.eventName),
	index("batch_info_history_created_at_idx").on(table.createdAt),
	index("batch_info_history_batch_id_entity_id_idx").on(table.batchId, table.entityId),
	primaryKey({ columns: [table.id], name: "batch_info_history_id"}),
]);

export const batchInfoStages = mysqlTable("batch_info_stages", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	unapprovedAt: timestamp("unapproved_at", { mode: 'string' }),
},
(table) => [
	index("batch_info_stages_batch_id_idx").on(table.batchId),
	index("batch_info_stages_title_idx").on(table.title),
	index("batch_info_stages_status_idx").on(table.status),
	primaryKey({ columns: [table.id], name: "batch_info_stages_id"}),
]);

export const batchInfoTemplateItems = mysqlTable("batch_info_template_items", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	batchInfoTemplateId: bigint("batch_info_template_id", { mode: "number", unsigned: true }).notNull().references(() => batchInfoTemplates.id, { onDelete: "cascade" } ),
	item: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	description: text(),
	team: varchar({ length: 50 }),
},
(table) => [
	index("batch_info_template_items_batch_info_template_id_idx").on(table.batchInfoTemplateId),
	index("batch_info_template_items_type_idx").on(table.type),
	primaryKey({ columns: [table.id], name: "batch_info_template_items_id"}),
]);

export const batchInfoTemplates = mysqlTable("batch_info_templates", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	stageId: int("stage_id", { unsigned: true }),
	status: varchar({ length: 50 }).default('Draft').notNull(),
},
(table) => [
	index("batch_info_templates_title_idx").on(table.title),
	index("batch_info_templates_status_idx").on(table.status),
	index("batch_info_templates_stage_id_idx").on(table.stageId),
	primaryKey({ columns: [table.id], name: "batch_info_templates_id"}),
]);

export const batchParticipants = mysqlTable("batch_participants", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => meetings.lectureId),
	zoomId: varchar("zoom_id", { length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	joinTime: datetime("join_time", { mode: 'string'}),
	leaveTime: datetime("leave_time", { mode: 'string'}),
	device: varchar({ length: 255 }),
	ipAddress: varchar("ip_address", { length: 255 }),
	location: varchar({ length: 255 }),
	networkType: varchar("network_type", { length: 255 }),
	dataCenter: varchar("data_center", { length: 255 }),
	connectionType: varchar("connection_type", { length: 255 }),
	shareApplication: tinyint("share_application"),
	shareDesktop: tinyint("share_desktop"),
	shareWhiteboard: tinyint("share_whiteboard"),
	recording: tinyint(),
	status: varchar({ length: 255 }),
	pcName: varchar("pc_name", { length: 255 }),
	domain: varchar({ length: 255 }),
	macAddr: varchar("mac_addr", { length: 255 }),
	leaveReason: varchar("leave_reason", { length: 255 }),
	duration: int().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("batch_participants_email_index").on(table.email),
	index("batch_participants_lecture_id_index").on(table.lectureId),
	index("batch_participants_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "batch_participants_id"}),
]);

export const batchQcReports = mysqlTable("batch_qc_reports", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	batchId: int("batch_id").notNull(),
	qcType: mysqlEnum("qc_type", ['ppt','website']).notNull(),
	report: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_batch_qc").on(table.batchId, table.qcType),
	primaryKey({ columns: [table.id], name: "batch_qc_reports_id"}),
]);

export const batchUser = mysqlTable("batch_user", {
	id: int().autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	deletedAt: datetime("deleted_at", { mode: 'string'}),
	username: varchar({ length: 300 }),
	admission: varchar({ length: 300 }),
	role: varchar({ length: 300 }),
	inTime: datetime("in_time", { mode: 'string'}),
	outTime: datetime("out_time", { mode: 'string'}),
	isActive: tinyint("is_active"),
	meta: varchar({ length: 300 }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	status: varchar({ length: 300 }),
	history: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "batch_user_id"}),
]);

export const batchUserStatusLogs = mysqlTable("batch_user_status_logs", {
	id: int().autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	batchId: bigint("batch_id", { mode: "number" }).notNull(),
	status: varchar({ length: 300 }),
	history: json(),
	updatedBy: varchar("updated_by", { length: 191 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "batch_user_status_logs_id"}),
]);

export const batches = mysqlTable("batches", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	starting: date({ mode: 'string' }).notNull(),
	duration: varchar({ length: 255 }).notNull(),
	program: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	options: json(),
	meta: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ending: date({ mode: 'string' }),
	mode: varchar({ length: 255 }),
	model: varchar({ length: 255 }),
	durationMonths: int("duration_months"),
	iteration: int(),
	language: varchar({ length: 50 }),
	partners: varchar({ length: 255 }),
	programDomain: varchar("program_domain", { length: 255 }),
	programType: varchar("program_type", { length: 255 }),
},
(table) => [
	index("idx_name").on(table.name),
	index("idx_starting").on(table.starting),
	index("idx_duration").on(table.duration),
	index("idx_program").on(table.program),
	index("idx_active").on(table.active),
	index("idx_starting_active").on(table.starting, table.active),
	index("idx_active_starting").on(table.active, table.starting),
	primaryKey({ columns: [table.id], name: "batches_id"}),
]);

export const blockDraftUnitMovements = mysqlTable("block_draft_unit_movements", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	draftUnitMovementId: bigint("draft_unit_movement_id", { mode: "number", unsigned: true }).references(() => draftUnitMovements.id, { onDelete: "cascade" } ),
	blockId: int("block_id", { unsigned: true }).references(() => blocks.id, { onDelete: "cascade" } ),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id, { onDelete: "cascade" } ),
	newSectionId: int("new_section_id", { unsigned: true }).references(() => sections.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	evalScore: double("eval_score"),
	eval: json(),
	attendancePercent: double("attendance_percent"),
	assignmentPercent: double("assignment_percent"),
	currentAsyncCount: int("current_async_count").default(0).notNull(),
	terminated: tinyint(),
	excluded: tinyint(),
	completed: tinyint(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	suspectList: tinyint("suspect_list").default(0).notNull(),
	newSectionSuspectList: tinyint("new_section_suspect_list").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "block_draft_unit_movements_id"}),
]);

export const blockUnitMovementEmailTemplates = mysqlTable("block_unit_movement_email_templates", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	body: longtext().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	variables: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	from: varchar({ length: 255 }),
	cc: varchar({ length: 255 }),
	bcc: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "block_unit_movement_email_templates_id"}),
]);

export const blockUnitMovementEmails = mysqlTable("block_unit_movement_emails", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	body: longtext().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	variables: json().notNull(),
	blockId: int("block_id", { unsigned: true }).references(() => blocks.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	from: varchar({ length: 255 }),
	cc: varchar({ length: 255 }),
	bcc: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "block_unit_movement_emails_id"}),
]);

export const blocks = mysqlTable("blocks", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	starting: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ending: date({ mode: 'string' }).notNull(),
	duration: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	options: json(),
	meta: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "blocks_id"}),
]);

export const blueprints = mysqlTable("blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }).notNull(),
	active: tinyint().notNull(),
	type: varchar({ length: 255 }).notNull(),
	settings: json(),
	assignmentPercentageWeightage: int("assignment_percentage_weightage").notNull(),
	attendancePercentageWeightage: int("attendance_percentage_weightage").notNull(),
	dayBlock: varchar("day_block", { length: 255 }),
	level: varchar({ length: 255 }),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id, { onDelete: "set null" } ),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "blueprints_id"}),
]);

export const bookmarks = mysqlTable("bookmarks", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	isBookmarked: tinyint("is_bookmarked").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("bookmarks_entity_type_entity_id_index").on(table.entityType, table.entityId),
	primaryKey({ columns: [table.id], name: "bookmarks_id"}),
]);

export const bountyPrograms = mysqlTable("bounty_programs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	username: varchar({ length: 255 }).notNull(),
	bountiesWon: bigint("bounties_won", { mode: "number", unsigned: true }).notNull(),
	coins: bigint({ mode: "number", unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "bounty_programs_id"}),
	unique("bounty_programs_username_unique").on(table.username),
]);

export const certificates = mysqlTable("certificates", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	type: varchar({ length: 255 }).notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "certificates_id"}),
]);

export const clubMembers = mysqlTable("club_members", {
	id: char({ length: 36 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	clubId: char("club_id", { length: 36 }).notNull().references(() => clubs.id, { onDelete: "cascade" } ),
	role: varchar({ length: 50 }).default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("club_members_club_id_index").on(table.clubId),
	primaryKey({ columns: [table.id], name: "club_members_id"}),
	unique("club_members_user_id_club_id_unique").on(table.userId, table.clubId),
]);

export const clubPostBookmarks = mysqlTable("club_post_bookmarks", {
	id: char({ length: 36 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	postId: char("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("club_post_bookmarks_post_id_index").on(table.postId),
	primaryKey({ columns: [table.id], name: "club_post_bookmarks_id"}),
	unique("club_post_bookmarks_user_id_post_id_unique").on(table.userId, table.postId),
]);

export const clubs = mysqlTable("clubs", {
	id: char({ length: 36 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	domain: varchar({ length: 255 }),
	image: text(),
	meta: json(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("clubs_created_by_index").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "clubs_id"}),
]);

export const comments = mysqlTable("comments", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	ticketId: int("ticket_id", { unsigned: true }).notNull().references(() => tickets.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	message: text().notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	public: tinyint().default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("comments_created_at_index").on(table.createdAt),
	index("comments_updated_at_index").on(table.updatedAt),
	primaryKey({ columns: [table.id], name: "comments_id"}),
]);

export const companies = mysqlTable("companies", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	website: text(),
	category: varchar({ length: 255 }),
	tags: varchar({ length: 255 }),
	data: json(),
	info: json(),
	settings: json(),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	industry: varchar({ length: 255 }),
	socialMedia: json("social_media"),
	leadSource: varchar("lead_source", { length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "companies_id"}),
]);

export const disbursalStatuses = mysqlTable("disbursal_statuses", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	oldStatus: varchar("old_status", { length: 255 }),
	newStatus: varchar("new_status", { length: 255 }),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	data: json(),
	info: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("disbursal_statuses_entity_type_entity_id_index").on(table.entityType, table.entityId),
	primaryKey({ columns: [table.id], name: "disbursal_statuses_id"}),
]);

export const discussions = mysqlTable("discussions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	title: text().notNull(),
	message: text().notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	isClosed: tinyint("is_closed").default(0).notNull(),
	public: tinyint().default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	assigneeId: bigint("assignee_id", { mode: "number", unsigned: true }).references(() => users.id),
	gptCentralData: json("gpt_central_data"),
},
(table) => [
	index("discussions_entity_type_entity_id_index").on(table.entityType, table.entityId),
	primaryKey({ columns: [table.id], name: "discussions_id"}),
]);

export const draftUnitMovements = mysqlTable("draft_unit_movements", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	unitMovementRuleId: bigint("unit_movement_rule_id", { mode: "number", unsigned: true }).references(() => unitMovementRules.id, { onDelete: "cascade" } ),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id, { onDelete: "cascade" } ),
	newSectionId: int("new_section_id", { unsigned: true }).references(() => sections.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	priority: double(),
	evalScore: double("eval_score"),
	eval: json(),
	attendancePercent: double("attendance_percent"),
	assignmentPercent: double("assignment_percent"),
	currentAsyncCount: int("current_async_count").default(0).notNull(),
	terminated: tinyint(),
	excluded: tinyint(),
	completed: tinyint(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	suspectList: tinyint("suspect_list").default(0).notNull(),
	newSectionSuspectList: tinyint("new_section_suspect_list").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "draft_unit_movements_id"}),
]);

export const eeCycleRecords = mysqlTable("ee_cycle_records", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id),
	cycleId: int("cycle_id", { unsigned: true }).notNull().references(() => payoutCycles.id),
	payType: varchar("pay_type", { length: 50 }).notNull(),
	payRate: decimal("pay_rate", { precision: 10, scale: 2 }).notNull(),
	weeklyHoursCommitted: int("weekly_hours_committed", { unsigned: true }),
	monthlyHoursCommitted: int("monthly_hours_committed", { unsigned: true }),
	sessionsScheduled: int("sessions_scheduled", { unsigned: true }),
	sessionsCompleted: int("sessions_completed", { unsigned: true }),
	sessionsMissed: int("sessions_missed", { unsigned: true }),
	leavesCount: int("leaves_count", { unsigned: true }),
	avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
	computedPayout: decimal("computed_payout", { precision: 12, scale: 2 }),
	adjustments: decimal({ precision: 12, scale: 2 }),
	finalPayout: decimal("final_payout", { precision: 12, scale: 2 }),
	payoutStatus: varchar("payout_status", { length: 50 }).default('Pending').notNull(),
	payoutReference: varchar("payout_reference", { length: 255 }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	flagsDeviations: json("flags_deviations"),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	generatedPayoutInvoice: varchar("generated_payout_invoice", { length: 2048 }),
	invoiceGenerationStatus: mysqlEnum("invoice_generation_status", ['Pending','InProgress','Failed','Generated']).default('Pending').notNull(),
},
(table) => [
	index("ee_cycle_records_cycle_id_index").on(table.cycleId),
	index("ee_cycle_records_payout_status_index").on(table.payoutStatus),
	primaryKey({ columns: [table.id], name: "ee_cycle_records_id"}),
	unique("ee_cycle_records_ee_id_cycle_id_unique").on(table.eeId, table.cycleId),
]);

export const eeEngagementCosts = mysqlTable("ee_engagement_costs", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	engagementType: varchar("engagement_type", { length: 50 }).notNull(),
	fixedCost: decimal("fixed_cost", { precision: 10, scale: 2 }).notNull(),
	variableCost: decimal("variable_cost", { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("ee_engagement_costs_ee_id_idx").on(table.eeId),
	index("ee_engagement_costs_user_id_idx").on(table.userId),
	primaryKey({ columns: [table.id], name: "ee_engagement_costs_id"}),
	unique("ee_engagement_costs_ee_id_engagement_type_key").on(table.eeId, table.engagementType),
]);

export const eeLeaveRequests = mysqlTable("ee_leave_requests", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	leaveType: varchar("leave_type", { length: 50 }).notNull(),
	reason: text(),
	status: varchar({ length: 50 }).default('Pending').notNull(),
	approvedBy: bigint("approved_by", { mode: "number", unsigned: true }).references(() => users.id),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	adminRemarks: text("admin_remarks"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("ee_leave_requests_ee_id_index").on(table.eeId),
	index("ee_leave_requests_status_index").on(table.status),
	index("ee_leave_requests_date_range_index").on(table.startDate, table.endDate),
	primaryKey({ columns: [table.id], name: "ee_leave_requests_id"}),
]);

export const eeOnboardingForm = mysqlTable("ee_onboarding_form", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id),
	status: mysqlEnum(['Pending','Approved','Rejected']).default('Pending').notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: text().notNull(),
	marketingWebsiteAcknowledgement: tinyint("marketing_website_acknowledgement").default(0).notNull(),
	contactNumber: varchar("contact_number", { length: 15 }).notNull(),
	panNumber: char("pan_number", { length: 10 }).notNull(),
	panDocumentUrl: varchar("pan_document_url", { length: 2048 }).notNull(),
	panDocumentMimeType: varchar("pan_document_mime_type", { length: 127 }),
	panDocumentFileSize: int("pan_document_file_size", { unsigned: true }),
	panDocumentOriginalFilename: varchar("pan_document_original_filename", { length: 255 }),
	bankName: varchar("bank_name", { length: 255 }).notNull(),
	ifscCode: char("ifsc_code", { length: 11 }).notNull(),
	bankBranch: varchar("bank_branch", { length: 255 }).notNull(),
	accountNumber: varchar("account_number", { length: 18 }).notNull(),
	bankProofUrl: varchar("bank_proof_url", { length: 2048 }).notNull(),
	bankProofMimeType: varchar("bank_proof_mime_type", { length: 127 }),
	bankProofFileSize: int("bank_proof_file_size", { unsigned: true }),
	bankProofOriginalFilename: varchar("bank_proof_original_filename", { length: 255 }),
	photoUrl: varchar("photo_url", { length: 2048 }),
	gender: mysqlEnum(['male','female','prefer_not_to_say']),
	languagesKnown: text("languages_known"),
	educationDetails: text("education_details"),
	currentCompany: varchar("current_company", { length: 255 }),
	designation: varchar({ length: 255 }),
	techStacks: text("tech_stacks"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("ee_onboarding_form_user_id_index").on(table.userId),
	index("ee_onboarding_form_ee_id_index").on(table.eeId),
	index("ee_onboarding_form_status_index").on(table.status),
	primaryKey({ columns: [table.id], name: "ee_onboarding_form_id"}),
]);

export const eePayoutHistories = mysqlTable("ee_payout_histories", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	ratePerHour: decimal("rate_per_hour", { precision: 10, scale: 2 }).notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: mysqlEnum(['AUTO_APPROVED','PENDING','APPROVED','REJECTED','PAID']).default('PENDING').notNull(),
	type: mysqlEnum(['FIXED','VARIABLE']).default('FIXED').notNull(),
	comment: text(),
	history: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("payout_history_user_id_index").on(table.userId),
	index("payout_history_lecture_id_index").on(table.lectureId),
	index("payout_history_status_index").on(table.status),
	primaryKey({ columns: [table.id], name: "ee_payout_histories_id"}),
	unique("payout_history_unique_lecture_user_ee_type").on(table.lectureId, table.userId, table.eeId, table.type),
]);

export const eeSectionMapping = mysqlTable("ee_section_mapping", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	role: varchar({ length: 50 }).notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("ee_section_mapping_section_id_index").on(table.sectionId),
	index("ee_section_mapping_batch_id_index").on(table.batchId),
	index("ee_section_mapping_is_active_index").on(table.isActive),
	primaryKey({ columns: [table.id], name: "ee_section_mapping_id"}),
	unique("ee_section_mapping_ee_id_section_id_unique").on(table.eeId, table.sectionId),
]);

export const electiveEntity = mysqlTable("elective_entity", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	electiveId: int("elective_id", { unsigned: true }).notNull().references(() => electives.id),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	priority: tinyint({ unsigned: true }).default(0).notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("elective_entity_entity_type_entity_id_index").on(table.entityType, table.entityId),
	primaryKey({ columns: [table.id], name: "elective_entity_id"}),
]);

export const electiveProgress = mysqlTable("elective_progress", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	electiveUserId: int("elective_user_id", { unsigned: true }).notNull().references(() => electiveUser.id),
	electiveEntityId: int("elective_entity_id", { unsigned: true }).notNull().references(() => electiveEntity.id),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	data: json(),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "elective_progress_id"}),
]);

export const electiveSection = mysqlTable("elective_section", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	electiveId: int("elective_id", { unsigned: true }).notNull().references(() => electives.id),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "elective_section_id"}),
]);

export const electiveUser = mysqlTable("elective_user", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	electiveId: int("elective_id", { unsigned: true }).notNull().references(() => electives.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	data: json(),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "elective_user_id"}),
]);

export const electives = mysqlTable("electives", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	description: text(),
	status: varchar({ length: 255 }),
	data: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "electives_id"}),
]);

export const eligibilities = mysqlTable("eligibilities", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	degree: varchar({ length: 255 }),
	stream: varchar({ length: 255 }),
	graduationYear: varchar("graduation_year", { length: 255 }),
	tenthPercentage: double("tenth_percentage"),
	twelfthPercentage: double("twelfth_percentage"),
	graduationPercentage: double("graduation_percentage"),
	locationDomicile: varchar("location_domicile", { length: 255 }),
	gender: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "eligibilities_id"}),
]);

export const emailNotificationLogs = mysqlTable("email_notification_logs", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	email: varchar({ length: 255 }).notNull(),
	notificationType: varchar("notification_type", { length: 50 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: int("entity_id", { unsigned: true }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("email_notification_logs_user_id_index").on(table.userId),
	index("email_notification_logs_entity_index").on(table.entityId, table.notificationType),
	index("email_notification_logs_created_at_index").on(table.createdAt),
	index("email_notification_logs_status_index").on(table.status),
	primaryKey({ columns: [table.id], name: "email_notification_logs_id"}),
	unique("email_notification_logs_unique").on(table.userId, table.entityId, table.notificationType),
]);

export const eventEnrollments = mysqlTable("event_enrollments", {
	id: char({ length: 36 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	eventId: char("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" } ),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("event_enrollments_event_id_index").on(table.eventId),
	primaryKey({ columns: [table.id], name: "event_enrollments_id"}),
	unique("event_enrollments_user_id_event_id_unique").on(table.userId, table.eventId),
]);

export const events = mysqlTable("events", {
	id: char({ length: 36 }).notNull(),
	clubId: char("club_id", { length: 36 }).references(() => clubs.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: mysqlEnum(['hackathon','meetup','webinar']),
	mode: mysqlEnum(['online','offline']),
	locationTitle: varchar("location_title", { length: 255 }),
	locationMapLink: text("location_map_link"),
	eventLink: text("event_link"),
	platform: varchar({ length: 50 }),
	startTime: timestamp("start_time", { mode: 'string' }),
	endTime: timestamp("end_time", { mode: 'string' }),
	meta: json(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	imageLink: text("image_link"),
},
(table) => [
	index("events_club_id_index").on(table.clubId),
	index("events_created_by_index").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "events_id"}),
]);

export const externalEmployees = mysqlTable("external_employees", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	empId: varchar("emp_id", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	contractType: varchar("contract_type", { length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	contractStartDate: date("contract_start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	contractEndDate: date("contract_end_date", { mode: 'string' }),
	role: varchar({ length: 50 }).notNull(),
	domain: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	mouSignedDate: date("mou_signed_date", { mode: 'string' }),
	mouFileUrl: varchar("mou_file_url", { length: 500 }),
	agreementText: text("agreement_text"),
	defaultPayType: varchar("default_pay_type", { length: 50 }),
	defaultPayRate: decimal("default_pay_rate", { precision: 10, scale: 2 }),
	contactDuration: varchar("contact_duration", { length: 100 }),
	specializations: json(),
	photoUrl: varchar("photo_url", { length: 2048 }),
	position: varchar({ length: 255 }),
	university: varchar({ length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 2048 }),
	description: text(),
	defaultWeeklyHours: int("default_weekly_hours", { unsigned: true }),
	defaultMonthlyHours: int("default_monthly_hours", { unsigned: true }),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	index("external_employees_status_index").on(table.status),
	index("external_employees_role_index").on(table.role),
	index("external_employees_contract_end_date_index").on(table.contractEndDate),
	primaryKey({ columns: [table.id], name: "external_employees_id"}),
	unique("external_employees_user_id_key").on(table.userId),
	unique("external_employees_emp_id_key").on(table.empId),
]);

export const externalOffers = mysqlTable("external_offers", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	status: varchar({ length: 255 }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	ctc: decimal({ precision: 4, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	doj: date({ mode: 'string' }).notNull(),
	offerLetter: varchar("offer_letter", { length: 255 }),
	offerLetterSentToOpsAt: datetime("offer_letter_sent_to_ops_at", { mode: 'string'}),
	data: json(),
	info: json(),
	leadId: bigint("lead_id", { mode: "number", unsigned: true }).references(() => leads.id),
	companyId: bigint("company_id", { mode: "number", unsigned: true }).references(() => companies.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "external_offers_id"}),
]);

export const externalProblemSubmissions = mysqlTable("external_problem_submissions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	externalId: int("external_id").notNull(),
	externalProblemUserId: varchar("external_problem_user_id", { length: 255 }),
	username: varchar({ length: 255 }),
	externalProblemId: int("external_problem_id"),
	externalProblemTitle: varchar("external_problem_title", { length: 255 }),
	platform: varchar({ length: 255 }),
	score: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "external_problem_submissions_id"}),
	unique("external_problem_submissions_external_id_platform_unique").on(table.externalId, table.platform),
]);

export const failedJobs = mysqlTable("failed_jobs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	uuid: varchar({ length: 255 }).notNull(),
	connection: text().notNull(),
	queue: text().notNull(),
	payload: longtext().notNull(),
	exception: longtext().notNull(),
	failedAt: timestamp("failed_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "failed_jobs_id"}),
	unique("failed_jobs_uuid_unique").on(table.uuid),
]);

export const feedback = mysqlTable("feedback", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	variables: json().notNull(),
	settings: json(),
	quizId: int("quiz_id", { unsigned: true }).references(() => quizzes.id),
	feedbackBlueprintId: bigint("feedback_blueprint_id", { mode: "number", unsigned: true }).references(() => feedbackBlueprints.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	startTime: datetime("start_time", { mode: 'string'}),
	endTime: datetime("end_time", { mode: 'string'}),
},
(table) => [
	index("idx_name").on(table.name),
	primaryKey({ columns: [table.id], name: "feedback_id"}),
]);

export const feedbackBlueprints = mysqlTable("feedback_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	variables: json().notNull(),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "feedback_blueprints_id"}),
]);

export const feedbackGptCentral = mysqlTable("feedback_gpt_central", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	data: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "feedback_gpt_central_id"}),
]);

export const feedbackQuestionBlueprints = mysqlTable("feedback_question_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	feedbackBlueprintId: bigint("feedback_blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => feedbackBlueprints.id),
	question: text().notNull(),
	type: varchar({ length: 255 }).notNull(),
	options: json(),
	range: json(),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	optional: tinyint().default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "feedback_question_blueprints_id"}),
]);

export const feedbackQuestions = mysqlTable("feedback_questions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	feedbackId: bigint("feedback_id", { mode: "number", unsigned: true }).notNull().references(() => feedback.id),
	question: text().notNull(),
	type: varchar({ length: 255 }).notNull(),
	options: json(),
	range: json(),
	settings: json(),
	feedbackQuestionBlueprintId: bigint("feedback_question_blueprint_id", { mode: "number", unsigned: true }).references(() => feedbackQuestionBlueprints.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	optional: tinyint().default(0).notNull(),
},
(table) => [
	index("idx_question").on(table.question),
	primaryKey({ columns: [table.id], name: "feedback_questions_id"}),
]);

export const feedbackResponses = mysqlTable("feedback_responses", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	feedbackId: bigint("feedback_id", { mode: "number", unsigned: true }).notNull().references(() => feedback.id),
	feedbackQuestionId: bigint("feedback_question_id", { mode: "number", unsigned: true }).notNull().references(() => feedbackQuestions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	response: longtext().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "feedback_responses_id"}),
]);

export const flagQuery = mysqlTable("flag_query", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	flagId: bigint("flag_id", { mode: "number", unsigned: true }).notNull().references(() => flags.id),
	queryId: bigint("query_id", { mode: "number", unsigned: true }).notNull().references(() => queries.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "flag_query_id"}),
]);

export const flags = mysqlTable("flags", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	flag: varchar({ length: 255 }).notNull(),
	flagDescription: varchar("flag_description", { length: 255 }),
	flagEntity: varchar("flag_entity", { length: 255 }),
	flagEntityId: int("flag_entity_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	flagDate: date("flag_date", { mode: 'string' }).notNull(),
	flagScore: double("flag_score"),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "flags_id"}),
]);

export const githubs = mysqlTable("githubs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	token: varchar({ length: 255 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	githubUserId: int("github_user_id").notNull(),
	username: varchar({ length: 255 }).notNull(),
	repoName: varchar("repo_name", { length: 255 }),
	invitationAccepted: tinyint("invitation_accepted").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	gptCentralData: json("gpt_central_data"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "githubs_id"}),
	unique("githubs_token_unique").on(table.token),
	unique("githubs_github_user_id_unique").on(table.githubUserId),
	unique("githubs_username_unique").on(table.username),
	unique("githubs_repo_name_unique").on(table.repoName),
]);

export const guardian = mysqlTable("guardian", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	guardianId: bigint("guardian_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	mobile: varchar({ length: 255 }),
	address: varchar({ length: 255 }),
	status: varchar({ length: 255 }),
	verified: tinyint().default(0).notNull(),
	profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	meta: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "guardian_id"}),
	unique("guardian_id_unique").on(table.guardianId),
]);

export const guardianOtp = mysqlTable("guardian_otp", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	mobile: varchar({ length: 255 }).notNull(),
	otp: varchar({ length: 255 }).notNull(),
	expiryTime: timestamp({ mode: 'string' }).notNull(),
	attemptCount: int({ unsigned: true }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "guardian_otp_id"}),
	unique("guardian_otp_mobile_unique").on(table.mobile),
]);

export const helpFaqs = mysqlTable("help_faqs", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	category: varchar({ length: 255 }).notNull(),
	subCategory: varchar("sub_category", { length: 255 }).notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	assignees: json(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	redirectionToPc: tinyint("redirection_to_pc").default(0).notNull(),
	isHidden: tinyint("is_hidden").default(0).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("help_faqs_category_index").on(table.category),
	index("help_faqs_sub_category_index").on(table.subCategory),
	index("help_faqs_is_hidden_index").on(table.isHidden),
	index("help_faqs_category_sub_category_index").on(table.category, table.subCategory),
	primaryKey({ columns: [table.id], name: "help_faqs_id"}),
]);

export const instituteBatches = mysqlTable("institute_batches", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	instituteId: int("institute_id", { unsigned: true }).notNull().references(() => institutes.id, { onDelete: "cascade" } ),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("institute_batches_institute_id_index").on(table.instituteId),
	index("institute_batches_batch_id_index").on(table.batchId),
	primaryKey({ columns: [table.id], name: "institute_batches_id"}),
	unique("institute_batches_institute_batch_unique").on(table.instituteId, table.batchId),
]);

export const institutes = mysqlTable("institutes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	shortName: varchar("short_name", { length: 50 }),
	description: text(),
	logoUrl: varchar("logo_url", { length: 500 }),
	active: tinyint().default(1).notNull(),
	meta: json(),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("institutes_name_index").on(table.name),
	index("institutes_active_index").on(table.active),
	primaryKey({ columns: [table.id], name: "institutes_id"}),
]);

export const interactionMessages = mysqlTable("interaction_messages", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	interactionId: int("interaction_id", { unsigned: true }).notNull().references(() => interactions.id),
	message: text().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	sentAt: timestamp("sent_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "interaction_messages_id"}),
]);

export const interactions = mysqlTable("interactions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }),
	ticketId: int("ticket_id", { unsigned: true }).references(() => tickets.id),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "interactions_id"}),
]);

export const interviews = mysqlTable("interviews", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
	status: varchar({ length: 255 }),
	data: json(),
	info: json(),
	feedback: json(),
	startingAt: datetime("starting_at", { mode: 'string'}),
	endingAt: datetime("ending_at", { mode: 'string'}),
	applicationId: bigint("application_id", { mode: "number", unsigned: true }).notNull().references(() => applications.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	round: varchar({ length: 255 }),
	roundNumber: int("round_number"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "interviews_id"}),
]);

export const jobs = mysqlTable("jobs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	queue: varchar({ length: 255 }).notNull(),
	payload: longtext().notNull(),
	attempts: tinyint({ unsigned: true }).notNull(),
	reservedAt: int("reserved_at", { unsigned: true }),
	availableAt: int("available_at", { unsigned: true }).notNull(),
	createdAt: int("created_at", { unsigned: true }).notNull(),
},
(table) => [
	index("jobs_queue_index").on(table.queue),
	primaryKey({ columns: [table.id], name: "jobs_id"}),
]);

export const leads = mysqlTable("leads", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	category: varchar({ length: 255 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	data: json(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leads_id"}),
]);

export const learningObjectives = mysqlTable("learning_objectives", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	loId: varchar("lo_id", { length: 255 }).notNull(),
	loName: varchar("lo_name", { length: 255 }).notNull(),
	topicId: int("topic_id", { unsigned: true }).notNull().references(() => topicObjectives.id),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "learning_objectives_id"}),
]);

export const lectureAiGeneratedContent = mysqlTable("lecture_ai_generated_content", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	gptAiCentralData: json("gpt_ai_central_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "lecture_ai_generated_content_id"}),
]);

export const lectureBlueprints = mysqlTable("lecture_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	description: varchar({ length: 255 }),
	optional: tinyint().notNull(),
	blueprintId: bigint("blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => blueprints.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: int().notNull(),
	day: varchar({ length: 255 }).notNull(),
	zoomLink: varchar("zoom_link", { length: 255 }),
	notes: text(),
	videos: json(),
	settings: json(),
	data: json(),
	visible: tinyint(),
	vimeoPlayerEmbedUrl: varchar("vimeo_player_embed_url", { length: 255 }),
	vimeoDownloadLinks: json("vimeo_download_links"),
	lectureId: int("lecture_id", { unsigned: true }).references(() => lectures.id, { onDelete: "cascade" } ),
	scheduledTime: time("scheduled_time"),
	concludesTime: time("concludes_time"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	sectionFeedbackBlueprintId: bigint("section_feedback_blueprint_id", { mode: "number", unsigned: true }).references(() => sectionFeedbackBlueprints.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "lecture_blueprints_id"}),
]);

export const lectureFeedback = mysqlTable("lecture_feedback", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	response: json(),
	rating: int().default(0).notNull(),
	feedback: varchar({ length: 191 }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("lecture_feedback_lecture_id_foreign").on(table.lectureId),
	primaryKey({ columns: [table.id], name: "lecture_feedback_id"}),
]);

export const lectureInteractions = mysqlTable("lecture_interactions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	firstOpenedAt: timestamp("first_opened_at", { mode: 'string' }).notNull(),
	lastOpenedAt: timestamp("last_opened_at", { mode: 'string' }).notNull(),
	totalOpens: int("total_opens", { unsigned: true }).default(1).notNull(),
	contentScrollPercentage: tinyint("content_scroll_percentage", { unsigned: true }),
	notesViewed: tinyint("notes_viewed").default(0).notNull(),
	videosViewed: tinyint("videos_viewed").default(0).notNull(),
	aiContentViewed: tinyint("ai_content_viewed").default(0).notNull(),
	timeSpentSeconds: int("time_spent_seconds", { unsigned: true }),
	data: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("lecture_interactions_user_id_index").on(table.userId),
	index("lecture_interactions_lecture_id_index").on(table.lectureId),
	index("lecture_interactions_first_opened_at_index").on(table.firstOpenedAt),
	primaryKey({ columns: [table.id], name: "lecture_interactions_id"}),
	unique("lecture_interactions_lecture_user_unique").on(table.lectureId, table.userId),
]);

export const lectureParticipants = mysqlTable("lecture_participants", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	eeId: int("ee_id", { unsigned: true }).notNull().references(() => externalEmployees.id),
	eeRateType: varchar("ee_rate_type", { length: 191 }).default('LiveSession').notNull(),
	isEe: tinyint("is_ee").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("lecture_participants_lecture_id_index").on(table.lectureId),
	index("lecture_participants_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "lecture_participants_id"}),
]);

export const lectures = mysqlTable("lectures", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	module: varchar({ length: 255 }),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	description: text(),
	optional: tinyint().default(0).notNull(),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: tinyint({ unsigned: true }).notNull(),
	day: tinyint({ unsigned: true }).notNull(),
	schedule: datetime({ mode: 'string'}),
	concludes: datetime({ mode: 'string'}),
	zoomLink: varchar("zoom_link", { length: 255 }),
	isNewZoomRedirection: tinyint("is_new_zoom_redirection"),
	zoomDetails: json("zoom_details"),
	assessments: json(),
	notes: text(),
	videos: json(),
	settings: json(),
	data: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	vimeoPlayerEmbedUrl: varchar("vimeo_player_embed_url", { length: 255 }),
	vimeoDownloadLinks: json("vimeo_download_links"),
	feedbackId: bigint("feedback_id", { mode: "number", unsigned: true }).references(() => feedback.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	startTime: int("start_time"),
	endTime: int("end_time"),
	addToBlueprint: tinyint("add_to_blueprint").default(1).notNull(),
	gptCentralData: json("gpt_central_data"),
	hostId: bigint("host_id", { mode: "number", unsigned: true }).references(() => users.id),
	learningObjectives: json("learning_objectives"),
	feedbackResponseTrousers: json("feedback_response_trousers"),
	facultyResources: json("faculty_resources"),
},
(table) => [
	index("idx_category").on(table.category),
	index("idx_schedule").on(table.schedule),
	index("idx_title").on(table.title),
	index("idx_type").on(table.type),
	index("idx_concludes").on(table.concludes),
	index("idx_updated_at").on(table.updatedAt),
	primaryKey({ columns: [table.id], name: "lectures_id"}),
]);

export const lecturesAi = mysqlTable("lectures_ai", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	transcriptId: varchar({ length: 191 }),
	lastRefetchTime: datetime({ mode: 'string', fsp: 3 }),
	transcript: longtext(),
	summary: longtext(),
	concepts: json(),
	lectureId: int({ unsigned: true }).notNull().references(() => lectures.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	isConceptsPublished: tinyint(),
	isSummaryPublished: tinyint(),
	transcriptSegments: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "lectures_ai_id"}),
	unique("lectures_ai_lectureId_key").on(table.lectureId),
]);

export const lecturesCourse = mysqlTable("lectures_course", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	description: text(),
	optional: tinyint().default(0).notNull(),
	batchId: int("batch_id", { unsigned: true }),
	sectionId: int("section_id", { unsigned: true }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	week: tinyint({ unsigned: true }).notNull(),
	day: tinyint({ unsigned: true }).notNull(),
	schedule: datetime({ mode: 'string'}),
	concludes: datetime({ mode: 'string'}),
	zoomLink: varchar("zoom_link", { length: 255 }),
	notes: text(),
	videos: json(),
	settings: json(),
	data: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	vimeoPlayerEmbedUrl: varchar("vimeo_player_embed_url", { length: 255 }),
	vimeoDownloadLinks: json("vimeo_download_links"),
},
(table) => [
	index("lectures_batch_id_foreign").on(table.batchId),
	index("lectures_section_id_foreign").on(table.sectionId),
	index("lectures_user_id_foreign").on(table.userId),
	primaryKey({ columns: [table.id], name: "lectures_course_id"}),
]);

export const media = mysqlTable("media", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	location: varchar({ length: 255 }),
	type: varchar({ length: 255 }),
	data: json(),
	meta: json(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("media_entity_type_entity_id_index").on(table.entityType, table.entityId),
	index("media_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "media_id"}),
]);

export const meetings = mysqlTable("meetings", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	zoomId: varchar("zoom_id", { length: 255 }),
	uuid: varchar({ length: 255 }),
	topic: text(),
	userName: varchar("user_name", { length: 255 }),
	userEmail: varchar("user_email", { length: 255 }),
	startTime: datetime("start_time", { mode: 'string'}),
	endTime: datetime("end_time", { mode: 'string'}),
	duration: int().default(0).notNull(),
	totalMinutes: int("total_minutes").default(0).notNull(),
	participantsCount: int("participants_count").default(0).notNull(),
	classCount: int("class_count").default(0).notNull(),
	trackingFields: json("tracking_fields"),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }),
	optional: int().default(0).notNull(),
	hostId: int("host_id", { unsigned: true }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "meetings_id"}),
	unique("meetings_lecture_id_unique").on(table.lectureId),
]);

export const menus = mysqlTable("menus", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	category: varchar({ length: 255 }).notNull(),
	value: varchar({ length: 255 }).notNull(),
	ordering: mediumint().notNull(),
	data: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deprecated: tinyint().default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "menus_id"}),
]);

export const messages = mysqlTable("messages", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	subject: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	authorId: bigint("author_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	priority: varchar({ length: 255 }),
	readAt: datetime("read_at", { mode: 'string'}),
	meta: json(),
	messageId: bigint("message_id", { mode: "number", unsigned: true }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [table.id],
			name: "messages_message_id_foreign"
		}),
	primaryKey({ columns: [table.id], name: "messages_id"}),
]);

export const migrations = mysqlTable("migrations", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	migration: varchar({ length: 255 }).notNull(),
	batch: int().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "migrations_id"}),
]);

export const notes = mysqlTable("notes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }),
	body: text(),
	data: json(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	authorId: bigint("author_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("notes_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "notes_id"}),
]);

export const notificationLogs = mysqlTable("notification_logs", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	notificationType: varchar("notification_type", { length: 50 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: int("entity_id", { unsigned: true }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	data: json(),
	status: varchar({ length: 50 }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("notification_logs_user_id_index").on(table.userId),
	index("notification_logs_entity_index").on(table.entityType, table.entityId),
	index("notification_logs_type_index").on(table.notificationType),
	index("notification_logs_status_index").on(table.status),
	index("notification_logs_sent_at_index").on(table.sentAt),
	primaryKey({ columns: [table.id], name: "notification_logs_id"}),
	unique("notification_logs_unique_notification").on(table.userId, table.notificationType, table.entityId),
]);

export const notifications = mysqlTable("notifications", {
	id: char({ length: 36 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	notifiableType: varchar("notifiable_type", { length: 255 }).notNull(),
	notifiableId: bigint("notifiable_id", { mode: "number", unsigned: true }).notNull(),
	data: text().notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("notifications_notifiable_type_notifiable_id_index").on(table.notifiableType, table.notifiableId),
	primaryKey({ columns: [table.id], name: "notifications_id"}),
]);

export const npsForms = mysqlTable("nps_forms", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 191 }).notNull(),
	description: varchar({ length: 191 }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	startsAt: datetime("starts_at", { mode: 'string'}),
	endsAt: datetime("ends_at", { mode: 'string'}),
	status: mysqlEnum(['DRAFT','PUBLISHED','CLOSED']).default('DRAFT').notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	allowMultipleAttempts: tinyint("allow_multiple_attempts").default(0).notNull(),
	maxAttempts: int("max_attempts"),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "nps_forms_id"}),
]);

export const npsQuestionResponses = mysqlTable("nps_question_responses", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	npsSubmissionId: int("nps_submission_id", { unsigned: true }).notNull().references(() => npsSubmissions.id, { onDelete: "cascade" } ),
	npsQuestionId: int("nps_question_id", { unsigned: true }).notNull().references(() => npsQuestions.id, { onDelete: "cascade" } ),
	response: json().notNull(),
	answeredAt: timestamp("answered_at", { mode: 'string' }).defaultNow().notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "nps_question_responses_id"}),
	unique("nps_question_responses_nps_submission_id_nps_question_id_unique").on(table.npsSubmissionId, table.npsQuestionId),
]);

export const npsQuestions = mysqlTable("nps_questions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	npsFormId: int("nps_form_id", { unsigned: true }).notNull().references(() => npsForms.id, { onDelete: "cascade" } ),
	questionText: text("question_text").notNull(),
	questionType: mysqlEnum("question_type", ['MCQ_SINGLE','MCQ_MULTIPLE','DESCRIPTION','RATING_SCALE','DATE_PICKER','TRUE_FALSE']).notNull(),
	sequence: int().notNull(),
	isRequired: tinyint("is_required").default(0).notNull(),
	isScored: tinyint("is_scored").default(0).notNull(),
	config: json(),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	index("nps_questions_nps_form_id_sequence_index").on(table.npsFormId, table.sequence),
	primaryKey({ columns: [table.id], name: "nps_questions_id"}),
]);

export const npsSubmissions = mysqlTable("nps_submissions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	npsFormId: int("nps_form_id", { unsigned: true }).notNull().references(() => npsForms.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	attemptNumber: int("attempt_number").notNull(),
	status: mysqlEnum(['DRAFT','SUBMITTED','ABANDONED']).default('DRAFT').notNull(),
	isLocked: tinyint("is_locked").default(0).notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "nps_submissions_id"}),
	unique("nps_submissions_nps_form_id_user_id_attempt_number_unique").on(table.npsFormId, table.userId, table.attemptNumber),
]);

export const onboardingCallSummaries = mysqlTable("onboarding_call_summaries", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }),
	callId: varchar("call_id", { length: 255 }).notNull(),
	conversationId: varchar("conversation_id", { length: 255 }).notNull(),
	studentName: varchar("student_name", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
	courseName: varchar("course_name", { length: 255 }).notNull(),
	institutionName: varchar("institution_name", { length: 255 }).notNull(),
	pcName: varchar("pc_name", { length: 255 }).notNull(),
	agentName: varchar("agent_name", { length: 255 }).notNull(),
	callStatus: varchar("call_status", { length: 50 }),
	endStatus: varchar("end_status", { length: 50 }),
	callOutcome: varchar("call_outcome", { length: 50 }),
	recordingUrl: text("recording_url"),
	conversationSummary: text("conversation_summary"),
	transcription: longtext(),
	receivedAt: timestamp("received_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	meta: json(),
},
(table) => [
	index("onboarding_call_summaries_call_id_index").on(table.callId),
	index("onboarding_call_summaries_conversation_id_index").on(table.conversationId),
	index("onboarding_call_summaries_phone_number_index").on(table.phoneNumber),
	index("onboarding_call_summaries_course_name_index").on(table.courseName),
	index("onboarding_call_summaries_call_outcome_index").on(table.callOutcome),
	index("onboarding_call_summaries_received_at_index").on(table.receivedAt),
	index("onboarding_call_summaries_created_at_index").on(table.createdAt),
	primaryKey({ columns: [table.id], name: "onboarding_call_summaries_id"}),
	unique("onboarding_call_summaries_call_id_key").on(table.callId),
]);

export const opinions = mysqlTable("opinions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }),
	body: varchar({ length: 255 }),
	data: json(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("opinions_entity_type_entity_id_index").on(table.entityType, table.entityId),
	index("opinions_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "opinions_id"}),
]);

export const optInChoices = mysqlTable("opt_in_choices", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	trackName: varchar("track_name", { length: 255 }).notNull(),
	trackDescription: varchar("track_description", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "opt_in_choices_id"}),
]);

export const pages = mysqlTable("pages", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	content: longtext(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("pages_title_idx").on(table.title),
	primaryKey({ columns: [table.id], name: "pages_id"}),
]);

export const participantMetrics = mysqlTable("participant_metrics", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => meetings.lectureId),
	zoomId: varchar("zoom_id", { length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	actualUserId: bigint("actual_user_id", { mode: "number", unsigned: true }),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	joinTime: datetime("join_time", { mode: 'string'}),
	leaveTime: datetime("leave_time", { mode: 'string'}),
	device: varchar({ length: 255 }),
	ipAddress: varchar("ip_address", { length: 255 }),
	location: varchar({ length: 255 }),
	networkType: varchar("network_type", { length: 255 }),
	dataCenter: varchar("data_center", { length: 255 }),
	connectionType: varchar("connection_type", { length: 255 }),
	shareApplication: tinyint("share_application"),
	shareDesktop: tinyint("share_desktop"),
	shareWhiteboard: tinyint("share_whiteboard"),
	recording: tinyint(),
	status: varchar({ length: 255 }),
	pcName: varchar("pc_name", { length: 255 }),
	domain: varchar({ length: 255 }),
	macAddr: varchar("mac_addr", { length: 255 }),
	leaveReason: varchar("leave_reason", { length: 255 }),
	duration: int().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("participant_metrics_lecture_id_index").on(table.lectureId),
	index("participant_metrics_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "participant_metrics_id"}),
]);

export const participants = mysqlTable("participants", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => meetings.lectureId),
	zoomId: varchar("zoom_id", { length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	joinTime: datetime("join_time", { mode: 'string'}),
	leaveTime: datetime("leave_time", { mode: 'string'}),
	duration: int().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("participants_created_id_index").on(table.createdAt),
	index("participants_email_index").on(table.email),
	index("participants_join_time_index").on(table.joinTime),
	index("participants_lecture_id_index").on(table.lectureId),
	index("participants_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "participants_id"}),
]);

export const passwordResets = mysqlTable("password_resets", {
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
},
(table) => [
	index("password_resets_email_index").on(table.email),
]);

export const payoutCycles = mysqlTable("payout_cycles", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expectedPayDate: date("expected_pay_date", { mode: 'string' }),
	status: varchar({ length: 50 }).default('Draft').notNull(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("payout_cycles_status_index").on(table.status),
	index("payout_cycles_date_range_index").on(table.startDate, table.endDate),
	primaryKey({ columns: [table.id], name: "payout_cycles_id"}),
]);

export const personalAccessTokens = mysqlTable("personal_access_tokens", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
	tokenableId: bigint("tokenable_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 64 }).notNull(),
	abilities: text(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("personal_access_tokens_tokenable_type_tokenable_id_index").on(table.tokenableType, table.tokenableId),
	primaryKey({ columns: [table.id], name: "personal_access_tokens_id"}),
	unique("personal_access_tokens_token_unique").on(table.token),
]);

export const placementStatuses = mysqlTable("placement_statuses", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	status: varchar({ length: 255 }).notNull(),
	subStatus: varchar("sub_status", { length: 255 }),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	data: json(),
	info: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("placement_statuses_entity_type_entity_id_index").on(table.entityType, table.entityId),
	primaryKey({ columns: [table.id], name: "placement_statuses_id"}),
]);

export const placementTags = mysqlTable("placement_tags", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	taggableType: varchar("taggable_type", { length: 255 }).notNull(),
	taggableId: bigint("taggable_id", { mode: "number", unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("placement_tags_taggable_type_taggable_id_index").on(table.taggableType, table.taggableId),
	primaryKey({ columns: [table.id], name: "placement_tags_id"}),
]);

export const portfolioFeedback = mysqlTable("portfolio_feedback", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	submissionId: bigint("submission_id", { mode: "number", unsigned: true }).notNull().references(() => portfolioSubmissions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	comment: varchar({ length: 255 }).notNull(),
	videoUrl: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "portfolio_feedback_id"}),
]);

export const portfolioStudentIas = mysqlTable("portfolio_student_ias", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	iaId: bigint("ia_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	isActive: tinyint("is_active").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "portfolio_student_ias_id"}),
]);

export const portfolioSubmissions = mysqlTable("portfolio_submissions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	cpsubmissionid: int().notNull(),
	cpassignmentid: int().notNull(),
	problemInstanceid: int().notNull(),
	submissionUrl: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 255 }),
	score: int(),
	raisedForFeedback: mysqlEnum(['Unraised','Raised','Closed']).default('Unraised').notNull(),
	newComment: mysqlEnum(['None','Student','IA']).default('None').notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "portfolio_submissions_id"}),
]);

export const positionParams = mysqlTable("position_params", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	positionId: bigint("position_id", { mode: "number", unsigned: true }).notNull().references(() => positions.id),
	type: varchar({ length: 255 }).notNull(),
	value: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	data: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "position_params_id"}),
]);

export const positions = mysqlTable("positions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: json(),
	openings: smallint().default(1).notNull(),
	minSalary: decimal("min_salary", { precision: 4, scale: 2 }),
	maxSalary: decimal("max_salary", { precision: 4, scale: 2 }),
	category: varchar({ length: 255 }),
	tags: varchar({ length: 255 }),
	data: json(),
	info: json(),
	settings: json(),
	rounds: json(),
	status: varchar({ length: 255 }),
	additionalCriteria: text("additional_criteria"),
	applicationProcess: varchar("application_process", { length: 255 }),
	workingMode: varchar("working_mode", { length: 255 }),
	companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull().references(() => companies.id),
	eligibilityId: bigint("eligibility_id", { mode: "number", unsigned: true }).notNull().references(() => eligibilities.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	cpid: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	relocation: varchar({ length: 255 }),
	bond: tinyint(),
	bondDetails: text("bond_details"),
	openingsBdPoc: smallint("openings_bd_poc"),
	subStatus: varchar("sub_status", { length: 255 }),
	expectedClosure: int("expected_closure"),
	expectedClosureDate: datetime("expected_closure_date", { mode: 'string'}),
	difficultyLevelTech: varchar("difficulty_level_tech", { length: 255 }),
	intent: varchar({ length: 255 }),
	handbook: text(),
	openingType: varchar("opening_type", { length: 255 }),
	stipend: decimal({ precision: 5, scale: 2 }),
	internshipDuration: smallint("internship_duration"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "positions_id"}),
]);

export const positionsHistories = mysqlTable("positions_histories", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	positionId: bigint("position_id", { mode: "number", unsigned: true }).notNull().references(() => positions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	oldStatus: varchar("old_status", { length: 255 }),
	oldSubStatus: varchar("old_sub_status", { length: 255 }),
	newStatus: varchar("new_status", { length: 255 }),
	newSubStatus: varchar("new_sub_status", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "positions_histories_id"}),
]);

export const posts = mysqlTable("posts", {
	id: char({ length: 36 }).notNull(),
	clubId: char("club_id", { length: 36 }).notNull().references(() => clubs.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	title: varchar({ length: 255 }),
	content: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("posts_club_id_index").on(table.clubId),
	index("posts_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "posts_id"}),
]);

export const practiceInterviews = mysqlTable("practice_interviews", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	uniqueId: varchar("unique_id", { length: 255 }).notNull(),
	interviewId: varchar("interview_id", { length: 255 }).notNull(),
	token: varchar({ length: 255 }),
	interviewLink: varchar("interview_link", { length: 500 }),
	errorMessage: text("error_message"),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("practice_interviews_user_id_index").on(table.userId),
	index("practice_interviews_created_at_index").on(table.createdAt),
	index("practice_interviews_unique_id_index").on(table.uniqueId),
	primaryKey({ columns: [table.id], name: "practice_interviews_id"}),
]);

export const practiceQuizResponses = mysqlTable("practice_quiz_responses", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	entityId: int("entity_id", { unsigned: true }).notNull(),
	entityType: varchar("entity_type", { length: 255 }).notNull(),
	data: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	activePracticeSession: int("active_practice_session", { unsigned: true }).default(1).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practice_quiz_responses_id"}),
]);

export const practiceTestQuestions = mysqlTable("practice_test_questions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	assessQuestionId: varchar({ length: 255 }).notNull(),
	practiceSubTopicId: int("practice_sub_topic_id", { unsigned: true }).notNull().references(() => practiceTestSubTopics.id),
	difficulty: mysqlEnum(['Easy','Medium','Hard']).default('Medium').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practice_test_questions_id"}),
]);

export const practiceTestQuestionsUsersAttempted = mysqlTable("practice_test_questions_users_attempted", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	practiceTestQuestionId: int("practice_test_question_id", { unsigned: true }).notNull().references(() => practiceTestQuestions.id),
	assessToken: varchar({ length: 255 }).notNull(),
	isCorrect: tinyint().default(0).notNull(),
	isSkipped: tinyint().default(0).notNull(),
	score: int().default(0).notNull(),
	hasAvailedHint: tinyint().default(0).notNull(),
	isAttempted: tinyint().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practice_test_questions_users_attempted_id"}),
]);

export const practiceTestSubTopics = mysqlTable("practice_test_sub_topics", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	practiceTopicId: int("practice_topic_id", { unsigned: true }).notNull().references(() => practiceTestTopics.id),
	assessTagRelationshipId: varchar({ length: 255 }),
	iconsUrl: varchar({ length: 2048 }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practice_test_sub_topics_id"}),
]);

export const practiceTestTopics = mysqlTable("practice_test_topics", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	iconsUrl: varchar({ length: 2048 }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practice_test_topics_id"}),
]);

export const problemLinks = mysqlTable("problem_links", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	platform: varchar({ length: 255 }).notNull(),
	externalProblemId: int("external_problem_id").notNull(),
	problemId: int("problem_id", { unsigned: true }).notNull().references(() => problems.id),
	assignmentId: int("assignment_id", { unsigned: true }).notNull().references(() => assignments.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "problem_links_id"}),
]);

export const problems = mysqlTable("problems", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	statement: text().notNull(),
	category: varchar({ length: 255 }).notNull(),
	topic: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	description: text(),
	approach: text(),
	rubrics: text(),
	type: mysqlEnum(['LINK','FILE','BUTTON']).default('LINK').notNull(),
	submissionProof: tinyint("submission_proof").default(0).notNull(),
	submissionInstructions: text("submission_instructions"),
	marks: tinyint({ unsigned: true }).default(1).notNull(),
	timing: smallint({ unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	options: json(),
	meta: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "problems_id"}),
]);

export const profileVerifies = mysqlTable("profile_verifies", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
	field: varchar({ length: 255 }),
	value: text(),
	oldValue: text("old_value"),
	verified: tinyint().default(0).notNull(),
	verifiedBy: bigint("verified_by", { mode: "number", unsigned: true }).references(() => users.id),
	verifiedAt: datetime("verified_at", { mode: 'string'}),
	rejectedBy: bigint("rejected_by", { mode: "number", unsigned: true }).references(() => users.id),
	rejectedAt: datetime("rejected_at", { mode: 'string'}),
	rejectedReason: varchar("rejected_reason", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "profile_verifies_id"}),
]);

export const profiles = mysqlTable("profiles", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date("birth_date", { mode: 'string' }),
	gender: mysqlEnum(['MALE','FEMALE','OTHER']).default('OTHER').notNull(),
	education: json(),
	experience: json(),
	family: json(),
	finance: json(),
	isa: json(),
	socialMedia: json("social_media"),
	meta: json(),
	info: json(),
	data: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	isaStatus: varchar("isa_status", { length: 255 }),
	isaSigningTime: timestamp("isa_signing_time", { mode: 'string' }),
	graduationTime: timestamp("graduation_time", { mode: 'string' }),
	placementTime: timestamp("placement_time", { mode: 'string' }),
	dropoutTime: timestamp("dropout_time", { mode: 'string' }),
	placement: json(),
	address: json(),
	placementStatus: varchar("placement_status", { length: 255 }),
	placementSubStatus: varchar("placement_sub_status", { length: 255 }),
	secondaryEmail: varchar("secondary_email", { length: 255 }),
	secondaryMobile: varchar("secondary_mobile", { length: 255 }),
	documents: json(),
	declaration: json(),
	stage: varchar({ length: 255 }),
	disbursalStatus: varchar("disbursal_status", { length: 255 }),
	resumeBuilderId: varchar("resume_builder_id", { length: 255 }),
	personalInfo: json("personal_info"),
	haveAcceptedLegalAggrement: tinyint(),
	haveClosedModal: int({ unsigned: true }),
	legalData: json("legal_data"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "profiles_id"}),
]);

export const programs = mysqlTable("programs", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	acronym: varchar({ length: 50 }).notNull(),
	description: text(),
	active: tinyint().default(1).notNull(),
	meta: json(),
	settings: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("programs_name_index").on(table.name),
	index("programs_active_index").on(table.active),
	index("programs_acronym_index").on(table.acronym),
	primaryKey({ columns: [table.id], name: "programs_id"}),
]);

export const queries = mysqlTable("queries", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	query: varchar({ length: 255 }).notNull(),
	queryDescription: varchar("query_description", { length: 255 }),
	queryStatus: varchar("query_status", { length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	queryDate: date("query_date", { mode: 'string' }).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "queries_id"}),
]);

export const queryComments = mysqlTable("query_comments", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	queryId: bigint("query_id", { mode: "number", unsigned: true }).notNull().references(() => queries.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	message: text().notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	public: tinyint().default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "query_comments_id"}),
]);

export const questionQuiz = mysqlTable("question_quiz", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	quizId: int("quiz_id", { unsigned: true }).notNull().references(() => quizzes.id),
	questionId: int("question_id", { unsigned: true }).notNull().references(() => questions.id),
	priority: tinyint({ unsigned: true }).default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "question_quiz_id"}),
]);

export const questions = mysqlTable("questions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	question: text().notNull(),
	category: varchar({ length: 255 }).notNull(),
	topic: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	explanation: text(),
	type: mysqlEnum(['MC','SHORT','LONG','TF','SC']).default('MC').notNull(),
	marks: tinyint({ unsigned: true }).default(1).notNull(),
	timing: smallint({ unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	options: json(),
	meta: json(),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "questions_id"}),
]);

export const quizBlueprints = mysqlTable("quiz_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	instructions: text(),
	optional: tinyint().notNull(),
	blueprintId: bigint("blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => blueprints.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: int().notNull(),
	day: varchar({ length: 255 }).notNull(),
	shuffle: tinyint().notNull(),
	timeLimit: int("time_limit").notNull(),
	showAnswers: tinyint("show_answers").notNull(),
	showScores: tinyint("show_scores").notNull(),
	settings: json(),
	data: json(),
	visible: tinyint().notNull(),
	quizId: int("quiz_id", { unsigned: true }).references(() => quizzes.id, { onDelete: "cascade" } ),
	scheduledTime: time("scheduled_time"),
	concludesTime: time("concludes_time"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quiz_blueprints_id"}),
]);

export const quizBlueprintsQuestions = mysqlTable("quiz_blueprints_questions", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	quizBlueprintId: bigint("quiz_blueprint_id", { mode: "number", unsigned: true }).notNull().references(() => quizBlueprints.id, { onDelete: "cascade" } ),
	questionId: int("question_id", { unsigned: true }).notNull().references(() => questions.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quiz_blueprints_questions_id"}),
]);

export const quizzes = mysqlTable("quizzes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	tags: varchar({ length: 255 }),
	instructions: text(),
	optional: tinyint().default(0).notNull(),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	week: tinyint({ unsigned: true }).notNull(),
	day: tinyint({ unsigned: true }).notNull(),
	shuffle: tinyint().default(0).notNull(),
	timeLimit: mediumint("time_limit", { unsigned: true }).notNull(),
	showAnswers: tinyint("show_answers").default(0).notNull(),
	showScores: tinyint("show_scores").default(0).notNull(),
	schedule: datetime({ mode: 'string'}),
	concludes: datetime({ mode: 'string'}),
	settings: json(),
	data: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	startTime: int("start_time"),
	endTime: int("end_time"),
	addToBlueprint: tinyint("add_to_blueprint").default(1).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "quizzes_id"}),
]);

export const rbacPermissions = mysqlTable("rbac_permissions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	resource: varchar({ length: 100 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("rbac_permissions_resource_idx").on(table.resource),
	index("rbac_permissions_action_idx").on(table.action),
	primaryKey({ columns: [table.id], name: "rbac_permissions_id"}),
	unique("rbac_permissions_resource_action_key").on(table.resource, table.action),
]);

export const rbacRolePermissions = mysqlTable("rbac_role_permissions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	roleId: int("role_id", { unsigned: true }).notNull().references(() => rbacRoles.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	permissionId: int("permission_id", { unsigned: true }).notNull().references(() => rbacPermissions.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("rbac_role_permissions_role_id_idx").on(table.roleId),
	index("rbac_role_permissions_permission_id_idx").on(table.permissionId),
	primaryKey({ columns: [table.id], name: "rbac_role_permissions_id"}),
	unique("rbac_role_permissions_role_id_permission_id_key").on(table.roleId, table.permissionId),
]);

export const rbacRoles = mysqlTable("rbac_roles", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	index("rbac_roles_name_idx").on(table.name),
	index("rbac_roles_deleted_at_idx").on(table.deletedAt),
	primaryKey({ columns: [table.id], name: "rbac_roles_id"}),
	unique("rbac_roles_name_key").on(table.name),
]);

export const rbacUserRoles = mysqlTable("rbac_user_roles", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	roleId: int("role_id", { unsigned: true }).notNull().references(() => rbacRoles.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	scopeType: varchar("scope_type", { length: 50 }).notNull(),
	batchId: int("batch_id", { unsigned: true }).references(() => batches.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	sectionId: int("section_id", { unsigned: true }).references(() => sections.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	assignedBy: bigint("assigned_by", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("rbac_user_roles_user_id_idx").on(table.userId),
	index("rbac_user_roles_role_id_idx").on(table.roleId),
	index("rbac_user_roles_scope_type_idx").on(table.scopeType),
	index("rbac_user_roles_batch_id_idx").on(table.batchId),
	index("rbac_user_roles_section_id_idx").on(table.sectionId),
	primaryKey({ columns: [table.id], name: "rbac_user_roles_id"}),
	unique("rbac_user_roles_user_id_role_id_scope_type_batch_id_section__key").on(table.userId, table.roleId, table.scopeType, table.batchId, table.sectionId),
]);

export const replies = mysqlTable("replies", {
	id: char({ length: 36 }).notNull(),
	postId: char("post_id", { length: 36 }).notNull().references(() => posts.id, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	content: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("replies_post_id_index").on(table.postId),
	index("replies_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "replies_id"}),
]);

export const scenes = mysqlTable("scenes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	order: int().notNull(),
	archived: tinyint().default(0).notNull(),
	successSceneId: int("success_scene_id", { unsigned: true }),
	failureSceneId: int("failure_scene_id", { unsigned: true }),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "scenes_id"}),
]);

export const sectionFeedbackBlueprints = mysqlTable("section_feedback_blueprints", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	variables: json().notNull(),
	settings: json(),
	quizId: int("quiz_id", { unsigned: true }).references(() => quizzes.id),
	feedbackBlueprintId: bigint("feedback_blueprint_id", { mode: "number", unsigned: true }).references(() => feedbackBlueprints.id),
	blueprintId: bigint("blueprint_id", { mode: "number", unsigned: true }).references(() => blueprints.id),
	feedbackId: bigint("feedback_id", { mode: "number", unsigned: true }).references(() => feedback.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "section_feedback_blueprints_id"}),
]);

export const sectionUser = mysqlTable("section_user", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	managerId: bigint("manager_id", { mode: "number", unsigned: true }).references(() => users.id),
	role: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	currentAsyncCount: int("current_async_count").default(0).notNull(),
	optInChoiceId: bigint("opt_in_choice_id", { mode: "number", unsigned: true }).references(() => optInChoices.id),
	permitted: tinyint(),
	suspectList: tinyint("suspect_list").default(0).notNull(),
	meta: json(),
},
(table) => [
	index("idx_role").on(table.role),
	primaryKey({ columns: [table.id], name: "section_user_id"}),
]);

export const sectionUserCourse = mysqlTable("section_user_course", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	managerId: bigint("manager_id", { mode: "number", unsigned: true }),
	role: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	currentAsyncCount: int("current_async_count").default(0).notNull(),
	optInChoiceId: bigint("opt_in_choice_id", { mode: "number", unsigned: true }),
	permitted: tinyint(),
},
(table) => [
	index("section_user_manager_id_foreign").on(table.managerId),
	index("section_user_opt_in_choice_id_foreign").on(table.optInChoiceId),
	index("section_user_section_id_foreign").on(table.sectionId),
	index("section_user_user_id_foreign").on(table.userId),
	primaryKey({ columns: [table.id], name: "section_user_course_id"}),
]);

export const sections = mysqlTable("sections", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	type: varchar({ length: 255 }).notNull(),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	settings: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	blockId: int("block_id", { unsigned: true }).references(() => blocks.id),
	assignmentPercentageWeightage: double("assignment_percentage_weightage", { precision: 8, scale: 2 }).notNull(),
	attendancePercentageWeightage: double("attendance_percentage_weightage", { precision: 8, scale: 2 }).notNull(),
	optInStartDatetime: timestamp("opt_in_start_datetime", { mode: 'string' }),
	optInEndDatetime: timestamp("opt_in_end_datetime", { mode: 'string' }),
	dayBlock: varchar("day_block", { length: 255 }),
	startTime: int("start_time"),
	endTime: int("end_time"),
	level: double({ precision: 8, scale: 2 }),
	courseType: varchar("course_type", { length: 255 }),
	unitMovementCompleted: tinyint("unit_movement_completed").default(0).notNull(),
	module: varchar({ length: 255 }),
},
(table) => [
	index("idx_name").on(table.name),
	primaryKey({ columns: [table.id], name: "sections_id"}),
]);

export const segments = mysqlTable("segments", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	sceneId: int("scene_id", { unsigned: true }).notNull().references(() => scenes.id),
	video: varchar({ length: 191 }),
	slide: json(),
	subtitle: varchar({ length: 191 }),
	order: int().notNull(),
	archived: tinyint().default(0).notNull(),
	type: varchar({ length: 191 }).notNull(),
	nextSegmentId: int("next_segment_id", { unsigned: true }),
	data: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "segments_id"}),
]);

export const sessions = mysqlTable("sessions", {
	id: varchar({ length: 255 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	payload: text().notNull(),
	lastActivity: int("last_activity").notNull(),
},
(table) => [
	index("sessions_last_activity_index").on(table.lastActivity),
	index("sessions_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "sessions_id"}),
]);

export const solutions = mysqlTable("solutions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	submissionId: int("submission_id", { unsigned: true }).notNull().references(() => submissions.id),
	problemId: int("problem_id", { unsigned: true }).notNull().references(() => problems.id),
	submissionLink: text("submission_link").notNull(),
	submissionProofLink: text("submission_proof_link"),
	feedback: json(),
	data: json(),
	score: tinyint({ unsigned: true }).default(0).notNull(),
	startedAt: datetime("started_at", { mode: 'string'}),
	submittedAt: datetime("submitted_at", { mode: 'string'}),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "solutions_id"}),
]);

export const studentAttendances = mysqlTable("student_attendances", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	schedule: datetime({ mode: 'string'}).notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	livePercentage: tinyint("live_percentage").default(0).notNull(),
	liveAttendanceStatus: tinyint("live_attendance_status").default(0).notNull(),
	joinedLate: tinyint("joined_late").default(0).notNull(),
	lateByMinutes: int("late_by_minutes", { unsigned: true }),
	videoPercentage: tinyint("video_percentage").default(0).notNull(),
	videoAttendanceStatus: tinyint("video_attendance_status").default(0).notNull(),
	videoLastUpdatedAt: timestamp("video_last_updated_at", { mode: 'string' }),
	includeVideoAttendance: tinyint("include_video_attendance").default(0).notNull(),
	catchUpDays: int("catch_up_days", { unsigned: true }),
	status: tinyint().default(0).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("student_attendances_user_id_schedule_index").on(table.userId, table.schedule),
	index("student_attendances_lecture_id_index").on(table.lectureId),
	index("student_attendances_section_id_schedule_index").on(table.sectionId, table.schedule),
	index("student_attendances_batch_id_index").on(table.batchId),
	index("student_attendances_schedule_index").on(table.schedule),
	index("student_attendances_status_index").on(table.status),
	primaryKey({ columns: [table.id], name: "student_attendances_id"}),
	unique("student_attendances_lecture_id_user_id_unique").on(table.lectureId, table.userId),
]);

export const studentTagCategories = mysqlTable("student_tag_categories", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	category: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	meta: json(),
	parentCategoryId: int("parent_category_id", { unsigned: true }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	foreignKey({
			columns: [table.parentCategoryId],
			foreignColumns: [table.id],
			name: "student_tag_categories_parent_category_id_foreign"
		}),
	primaryKey({ columns: [table.id], name: "student_tag_categories_id"}),
]);

export const studentTagNames = mysqlTable("student_tag_names", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "student_tag_names_id"}),
]);

export const studentTagRelation = mysqlTable("student_tag_relation", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	nameId: int("name_id", { unsigned: true }).notNull().references(() => studentTagNames.id),
	typeId: int("type_id", { unsigned: true }).notNull().references(() => studentTagTypes.id),
	categoryId: int("category_id", { unsigned: true }).notNull().references(() => studentTagCategories.id),
	active: tinyint().default(1).notNull(),
	global: tinyint().default(0).notNull(),
	visibleToStudent: tinyint("visible_to_student").default(1).notNull(),
	meta: json(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "student_tag_relation_id"}),
]);

export const studentTagTypes = mysqlTable("student_tag_types", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	type: varchar({ length: 255 }).notNull(),
	active: tinyint().default(1).notNull(),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "student_tag_types_id"}),
]);

export const submissions = mysqlTable("submissions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	assignmentId: int("assignment_id", { unsigned: true }).notNull().references(() => assignments.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	score: double().notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	data: json(),
	problems: json(),
	started: tinyint().default(0).notNull(),
	completed: tinyint().default(0).notNull(),
	markAsCompleted: tinyint("mark_as_completed"),
	status: varchar({ length: 255 }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "submissions_id"}),
]);

export const tasks = mysqlTable("tasks", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	entityId: bigint("entity_id", { mode: "number", unsigned: true }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	description: text(),
	taskType: varchar("task_type", { length: 50 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	assigneeId: bigint("assignee_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	source: varchar({ length: 255 }),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("tasks_assignee_id_idx").on(table.assigneeId),
	index("tasks_batch_id_idx").on(table.batchId),
	index("tasks_entity_id_idx").on(table.entityId),
	index("tasks_status_idx").on(table.status),
	index("tasks_task_type_idx").on(table.taskType),
	primaryKey({ columns: [table.id], name: "tasks_id"}),
]);

export const teamInvitations = mysqlTable("team_invitations", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	teamId: bigint("team_id", { mode: "number", unsigned: true }).notNull().references(() => teams.id, { onDelete: "cascade" } ),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "team_invitations_id"}),
	unique("team_invitations_team_id_email_unique").on(table.teamId, table.email),
]);

export const teamUser = mysqlTable("team_user", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	teamId: bigint("team_id", { mode: "number", unsigned: true }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	role: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "team_user_id"}),
	unique("team_user_team_id_user_id_unique").on(table.teamId, table.userId),
]);

export const teams = mysqlTable("teams", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	personalTeam: tinyint("personal_team").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("teams_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "teams_id"}),
]);

export const threads = mysqlTable("threads", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	discussionId: int("discussion_id", { unsigned: true }).notNull().references(() => discussions.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	message: text().notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	public: tinyint().default(0).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	readAt: timestamp("read_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "threads_id"}),
]);

export const ticketTemplates = mysqlTable("ticket_templates", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	description: longtext().notNull(),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	updatedBy: bigint("updated_by", { mode: "number", unsigned: true }).references(() => users.id),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	index("ticket_templates_created_by_index").on(table.createdBy),
	index("ticket_templates_updated_by_index").on(table.updatedBy),
	index("ticket_templates_title_index").on(table.title),
	primaryKey({ columns: [table.id], name: "ticket_templates_id"}),
]);

export const tickets = mysqlTable("tickets", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	title: text().notNull(),
	message: text().notNull(),
	data: json(),
	status: varchar({ length: 255 }),
	department: varchar({ length: 255 }),
	priority: varchar({ length: 255 }),
	isClosed: tinyint("is_closed").default(0).notNull(),
	assigneeId: bigint("assignee_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	closedAt: datetime("closed_at", { mode: 'string'}),
	meta: json(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	category: varchar({ length: 255 }).notNull(),
	agentId: bigint("agent_id", { mode: "number", unsigned: true }).references(() => users.id),
	rating: int({ unsigned: true }).default(0).notNull(),
	info: json(),
	logstamps: json(),
},
(table) => [
	index("tickets_created_at_index").on(table.createdAt),
	index("tickets_closed_at_index").on(table.closedAt),
	index("tickets_updated_at_index").on(table.updatedAt),
	primaryKey({ columns: [table.id], name: "tickets_id"}),
]);

export const topicObjectives = mysqlTable("topic_objectives", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	topicId: varchar("topic_id", { length: 255 }).notNull(),
	topicName: varchar("topic_name", { length: 255 }).notNull(),
	topicGroup: int("topic_group", { unsigned: true }).notNull().references(() => menus.id),
	meta: json(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "topic_objectives_id"}),
]);

export const unitMovementRules = mysqlTable("unit_movement_rules", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	newSectionId: int("new_section_id", { unsigned: true }).references(() => sections.id),
	priority: double().notNull(),
	minWeightedScore: double("min_weighted_score"),
	maxWeightedScore: double("max_weighted_score"),
	minAttendancePercentage: double("min_attendance_percentage"),
	maxAttendancePercentage: double("max_attendance_percentage"),
	minAssignmentPercentage: double("min_assignment_percentage"),
	maxAssignmentPercentage: double("max_assignment_percentage"),
	minCurrentAsyncCount: int("min_current_async_count"),
	maxCurrentAsyncCount: int("max_current_async_count"),
	minStrikeCount: int("min_strike_count"),
	maxStrikeCount: int("max_strike_count"),
	markUsersAsyncOnNewSection: tinyint("mark_users_async_on_new_section"),
	completed: tinyint(),
	optInChoiceId: bigint("opt_in_choice_id", { mode: "number", unsigned: true }).references(() => optInChoices.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "unit_movement_rules_id"}),
]);

export const unitMovementUserDetails = mysqlTable("unit_movement_user_details", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	userCode: varchar("user_code", { length: 255 }),
	lastActiveAt: datetime("last_active_at", { mode: 'string'}),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	ojAssignmentPercent: int("oj_assignment_percent"),
	assignmentPercent: int("assignment_percent"),
	attemptPercent: int("attempt_percent"),
	attendancePercent: int("attendance_percent"),
	eval: json(),
	evalOne: int("eval_one"),
	evalTwo: int("eval_two"),
	evalThree: int("eval_three"),
	evalFour: int("eval_four"),
	evalFive: int("eval_five"),
	evalSix: int("eval_six"),
	projectScore: int("project_score"),
	level: int({ unsigned: true }),
	asyncCount: int("async_count"),
	hackerrank: int(),
	strikeCount: int("strike_count"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "unit_movement_user_details_id"}),
]);

export const userBadges = mysqlTable("user_badges", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	badgeId: int("badge_id", { unsigned: true }).notNull().references(() => badges.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	badgeConfigId: int("badge_config_id", { unsigned: true }).notNull().references(() => badgeConfigs.id),
	badgeConfigSnapshot: json("badge_config_snapshot"),
	createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	releaseDate: date("release_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_badges_id"}),
	unique("user_badges_user_badge_config_unique").on(table.userId, table.badgeId, table.badgeConfigId),
]);

export const userBatchAdmissionData = mysqlTable("user_batch_admission_data", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id, { onDelete: "cascade" } ),
	idCardUrl: varchar("id_card_url", { length: 500 }),
	seatBlockingFeesPaid: tinyint("seat_blocking_fees_paid").default(0).notNull(),
	seatBlockingFeesAmount: decimal("seat_blocking_fees_amount", { precision: 10, scale: 2 }),
	seatBlockingFeesPaidDate: datetime("seat_blocking_fees_paid_date", { mode: 'string'}),
	seatBlockingFeesInvoice: varchar("seat_blocking_fees_invoice", { length: 500 }),
	fullFeesPaid: tinyint("full_fees_paid").default(0).notNull(),
	fullFeesAmount: decimal("full_fees_amount", { precision: 10, scale: 2 }),
	fullFeesPaidDate: datetime("full_fees_paid_date", { mode: 'string'}),
	fullFeesPaidInvoice: varchar("full_fees_paid_invoice", { length: 500 }),
	studentKitExists: tinyint("student_kit_exists").default(0).notNull(),
	studentKitDetailsFilled: tinyint("student_kit_details_filled").default(0).notNull(),
	studentKitTrackingUrl: varchar("student_kit_tracking_url", { length: 500 }),
	courseFeeDeadline: datetime("course_fee_deadline", { mode: 'string'}),
	lmsAccessDate: datetime("lms_access_date", { mode: 'string'}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	paymentUrl: varchar("payment_url", { length: 500 }),
	meta: json(),
},
(table) => [
	index("user_batch_admission_data_user_id_index").on(table.userId),
	index("user_batch_admission_data_batch_id_index").on(table.batchId),
	primaryKey({ columns: [table.id], name: "user_batch_admission_data_id"}),
	unique("user_batch_admission_data_user_id_batch_id_unique").on(table.userId, table.batchId),
]);

export const userBlockEmails = mysqlTable("user_block_emails", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	blockId: int("block_id", { unsigned: true }).references(() => blocks.id),
	blockUnitMovementEmailId: bigint("block_unit_movement_email_id", { mode: "number", unsigned: true }).notNull().references(() => blockUnitMovementEmails.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_block_emails_id"}),
]);

export const userCallbackTickets = mysqlTable("user_callback_tickets", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	resolvedBy: bigint("resolved_by", { mode: "number", unsigned: true }).references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	category: varchar({ length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('pending').notNull(),
	meta: json(),
	assignedTo: bigint("assigned_to", { mode: "number", unsigned: true }).references(() => users.id),
	preferredTimeSlot: varchar("preferred_time_slot", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	adminComment: text("admin_comment"),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	commentUpdatedAt: timestamp("comment_updated_at", { mode: 'string' }),
	logs: json(),
},
(table) => [
	index("user_callback_tickets_status_index").on(table.status),
	primaryKey({ columns: [table.id], name: "user_callback_tickets_id"}),
]);

export const userCertificates = mysqlTable("user_certificates", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	batchId: int("batch_id", { unsigned: true }).notNull().references(() => batches.id),
	certificateCode: varchar("certificate_code", { length: 250 }).notNull(),
	certificateUrl: text("certificate_url").notNull(),
	certificateType: varchar("certificate_type", { length: 250 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("idx_user_id").on(table.userId),
	index("idx_batch_id").on(table.batchId),
	index("idx_certificate_code").on(table.certificateCode),
	primaryKey({ columns: [table.id], name: "user_certificates_id"}),
	unique("unique_user_batch_type").on(table.userId, table.batchId, table.certificateType),
]);

export const userDeviceTokens = mysqlTable("user_device_tokens", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	token: varchar({ length: 255 }).notNull(),
	deviceType: varchar("device_type", { length: 50 }),
	deviceName: varchar("device_name", { length: 255 }),
	active: tinyint().default(1).notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	index("user_device_tokens_user_id_index").on(table.userId),
	index("user_device_tokens_token_index").on(table.token),
	index("user_device_tokens_active_index").on(table.active),
	primaryKey({ columns: [table.id], name: "user_device_tokens_id"}),
	unique("user_device_tokens_user_id_token_unique").on(table.userId, table.token),
]);

export const userDocuments = mysqlTable("user_documents", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	name: varchar({ length: 255 }).notNull(),
	link: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_documents_id"}),
]);

export const userGuardian = mysqlTable("user_guardian", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	guardianId: bigint("guardian_id", { mode: "number", unsigned: true }).notNull().references(() => guardian.guardianId, { onDelete: "cascade" } ),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_guardian_id"}),
]);

export const userRelation = mysqlTable("user_relation", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	relationId: int("relation_id", { unsigned: true }).notNull().references(() => studentTagRelation.id),
	sectionId: int("section_id", { unsigned: true }).notNull().references(() => sections.id),
	active: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_relation_id"}),
]);

export const userRelationHistory = mysqlTable("user_relation_history", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userRelationId: int("user_relation_id", { unsigned: true }).notNull().references(() => userRelation.id),
	oldValue: json("old_value"),
	newValue: json("new_value"),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_relation_history_id"}),
]);

export const userScenes = mysqlTable("user_scenes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	sceneId: int("scene_id", { unsigned: true }).notNull().references(() => scenes.id),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_scenes_id"}),
]);

export const userSegments = mysqlTable("user_segments", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	segmentId: int("segment_id", { unsigned: true }).notNull().references(() => segments.id),
	data: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "user_segments_id"}),
]);

export const userTags = mysqlTable("user_tags", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
},
(table) => [
	index("user_tags_user_id_index").on(table.userId),
	primaryKey({ columns: [table.id], name: "user_tags_id"}),
]);

export const users = mysqlTable("users", {
	id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	password: varchar({ length: 255 }).notNull(),
	twoFactorSecret: text("two_factor_secret"),
	twoFactorRecoveryCodes: text("two_factor_recovery_codes"),
	rememberToken: varchar("remember_token", { length: 100 }),
	currentTeamId: bigint("current_team_id", { mode: "number", unsigned: true }),
	profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	role: varchar({ length: 255 }),
	mobile: varchar({ length: 255 }),
	title: varchar({ length: 255 }),
	status: varchar({ length: 255 }),
	username: varchar({ length: 255 }),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
	statusTime: datetime("status_time", { mode: 'string'}),
	meta: json(),
},
(table) => [
	index("idx_name").on(table.name),
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const usersCourse = mysqlTable("users_course", {
	id: bigint({ mode: "number", unsigned: true }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { mode: 'string' }),
	password: varchar({ length: 255 }).notNull(),
	twoFactorSecret: text("two_factor_secret"),
	twoFactorRecoveryCodes: text("two_factor_recovery_codes"),
	rememberToken: varchar("remember_token", { length: 100 }),
	currentTeamId: bigint("current_team_id", { mode: "number", unsigned: true }),
	profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	role: varchar({ length: 255 }),
	mobile: varchar({ length: 255 }),
	title: varchar({ length: 255 }),
	status: varchar({ length: 255 }),
	username: varchar({ length: 255 }),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
	statusTime: datetime("status_time", { mode: 'string'}),
	meta: json(),
});

export const videoAttendances = mysqlTable("video_attendances", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	lectureId: int("lecture_id", { unsigned: true }).notNull().references(() => lectures.id),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	hostId: bigint("host_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
	category: varchar({ length: 255 }).notNull(),
	duration: int().notNull(),
	batchId: int("batch_id").notNull(),
	sectionId: int("section_id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	status: int().notNull(),
	schedule: datetime({ mode: 'string'}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	intervals: json(),
	totalDuration: int(),
	sessionToken: varchar({ length: 191 }),
	data: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "video_attendances_id"}),
]);

export const votes = mysqlTable("votes", {
	id: char({ length: 36 }).notNull(),
	userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	postId: char("post_id", { length: 36 }).references(() => posts.id, { onDelete: "cascade" } ),
	replyId: char("reply_id", { length: 36 }).references(() => replies.id, { onDelete: "cascade" } ),
	vote: mysqlEnum(['upvote','downvote']).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	voteTarget: varchar("vote_target", { length: 73 }).default(sql`((case when (`post_id` is not null) then concat(_utf8mb4\'p:\',`post_id`) else concat(_utf8mb4\'r:\',`reply_id`) end))`).notNull(),
},
(table) => [
	index("votes_post_id_index").on(table.postId),
	index("votes_reply_id_index").on(table.replyId),
	primaryKey({ columns: [table.id], name: "votes_id"}),
	unique("votes_user_id_vote_target_unique").on(table.userId, table.voteTarget),
]);

export const whatsnew = mysqlTable("whatsnew", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	image: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "whatsnew_id"}),
]);
