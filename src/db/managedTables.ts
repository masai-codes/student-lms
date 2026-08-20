/**
 * Manually maintained allowlist of MySQL tables this app uses.
 *
 * `npm run db:sync` / `drizzle-kit pull` only introspect and rewrite these tables
 * into `src/db/schema.ts`. Extra DB tables are ignored; unused schema exports are
 * dropped on the next sync.
 *
 * When you start using a new table:
 *   1. Add its SQL name here (snake_case, matching MySQL).
 *   2. Run `npm run db:sync`.
 *   3. Import the generated export from `@/db/schema`.
 *
 * When you stop using a table: remove it from this list and re-run `db:sync`.
 */
export const MANAGED_TABLES = [
  'ai_chat_practice_questions',
  'ai_tutor_sessions',
  'announcement_reads',
  'announcements',
  'assess_nps_form',
  'assess_nps_submissions',
  'assignment_problem',
  'assignments',
  'attendances',
  'badge_configs',
  'badges',
  'banners',
  'batch_user',
  'batches',
  'blocks',
  'bookmarks',
  'club_members',
  'clubs',
  'comments',
  'discussions',
  'event_enrollments',
  'events',
  'feedback',
  'feedback_blueprints',
  'help_faqs',
  'interview_sessions',
  'lecture_feedback',
  'lecture_zoom_chat',
  'lectures',
  'lectures_ai',
  'login_attempts',
  'masaiverse_banners',
  'masaiverse_leaderboard',
  'menus',
  'messages',
  'notification_logs',
  'opt_in_choices',
  'otp_codes',
  'posts',
  'problems',
  'profiles',
  'quizzes',
  'replies',
  'section_user',
  'sections',
  'sessions',
  'solutions',
  'student_attendances',
  'submissions',
  'threads',
  'tickets',
  'user_badges',
  'user_batch_admission_data',
  'user_callback_tickets',
  'user_device_tokens',
  'users',
  'video_attendances',
  'votes',
  'whatsnew',
  'zef_lms_meta_data',
  'zef_lms_lo',
  'zef_lms_feedback_submissions',
  'zef_lms_polls_questions',
  'zef_lms_polls_submissions',
  'zef_lms_quiz',
  'zef_lms_quiz_submission',
  'zef_lms_sql_sandbox',
] as const

type ManagedTable = (typeof MANAGED_TABLES)[number]
