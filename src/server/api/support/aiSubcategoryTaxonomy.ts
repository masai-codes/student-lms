/**
 * Support module — static subcategory taxonomy for AI classification.
 *
 * Deliberately hardcoded and independent of the (admin-editable, legacy)
 * `menus` table that drives the real "common questions" chip UI — so the AI
 * fallback classifier never silently breaks or drifts if someone edits menu
 * rows. Only consumed by `classifyTicketSubCategory.service.ts`, used when a
 * student skips the chip list and types their own message; the chips
 * students actually see still come from `menus` via `getSubcategoriesByCategory`
 * / `getTicketCategories`.
 *
 * `lecture` / `assignment` / `resource` / `evaluation` are flat, single-level
 * lists (matching their chip lists 1:1). `general_query` is two levels deep —
 * a topic bucket (e.g. `lms-and-platform-support`), each with its own short
 * list of specific questions — because lumping all ~48 general-query
 * questions into one flat list would force the classifier to disambiguate
 * far more (and more similar-sounding) options at once than necessary.
 */

/** The ticket.category value the floating chat's "General" tab writes — see `mapSupportCategoryToTicketCategory`. */
export const GENERAL_QUERY_CATEGORY = 'general_query'

/** Single-level taxonomies: category value → its flat list of specific questions. */
export const FLAT_SUBCATEGORY_TAXONOMY: Record<string, Array<string>> = {
  lecture: [
    'Unable to join live lecture',
    'Attendance not marked — Live session',
    "Attendance not marked — I watched the full recording but it still shows 'absent'",
    "Attendance not marked — I watched the full recording but it still shows 'Continue Watching'",
    'Need clarification on attendance criteria',
    'What is my total attendance %',
    'Lecture schedule / timing query',
    'Unable to play / view lecture recording',
    'Lecture transcript is unavailable',
    'Lecture notes are unavailable',
    'Lecture notes is different from lecture conducted',
    'Pre-read materials are unavailable',
    'Want to share feedback on lecture/instructor quality',
    'My attendance is not showing correctly in the progress report',
  ],
  assignment: [
    'Need clarification on instructions',
    'How to submit the assignment',
    "Submitted the assignment but the status is still showing 'Pending'",
    'Facing a technical issue while attempting my assignment',
    'Assignment question(s) different from lecture content',
    'Doubts related to assignment question',
    'Assignment deadline / extension query',
    "Assignment for the lecture/module hasn't been posted yet",
    'My practice assignment not graded',
    'Request for assignment question solutions',
  ],
  // NOTE: singular, matching the real `SupportEntityCategory` value used
  // throughout the codebase (the source reference list used plural "resources").
  resource: [
    'Notes / PPT not shared',
    'Request for consolidated / complete module notes',
    'Link/content shared during the live class is not available',
    'Unable to open notes / materials',
    'Resource not matching with lecture content',
    "Pre-requisite session's materials not available",
    'Others',
  ],
  evaluation: [
    'Delay in release of evaluation score',
    'Need clarity on evaluation syllabus',
    'Request for reschedule/re-attempt evaluation',
    'Incorrect marks have been given in my evaluation grading',
    'Technical issue during evaluation',
    'Technical issue during proctoring setup',
    'Evaluation question(s) out of syllabus',
    'Missed my evaluation',
    'Missed offline exam',
    'Did not receive admit card for my offline exam',
    'Have a query about my offline exam',
    'Need clarification on my CGPA / grading calculation',
    'Need clarification on exam schedule / weightage',
    'Unable to submit my Capstone project',
    'Clarification on the plagiarism policy',
    'Proctoring compatibility or setup related query',
    'Graded assignment score incorrectly marked',
    'Graded assignment score not visible',
    'Delayed / missed graded assignment submission',
    'Request for deadline extension of graded assignment',
    'Others',
  ],
}

/**
 * Two-level taxonomy for `general_query`: topic bucket → its flat list of
 * specific questions. `'general-query'` (hyphen) is itself one bucket among
 * the others here — the catch-all one — distinct from the top-level
 * `GENERAL_QUERY_CATEGORY` (`general_query`, underscore) that's actually
 * stored on `tickets.category`.
 */
export const GENERAL_QUERY_SUBCATEGORY_TAXONOMY: Record<
  string,
  Array<string>
> = {
  'general-query': [
    'Program start date or schedule related query',
    'Prerequisite or foundation session related query',
    'Upcoming workshop or masterclass related query',
    'Campus visit or offline event related query',
    'Course calendar related query',
    'Placement or career support related query',
    'Upcoming class or session schedule related query',
    'Query about my transition from foundation to the main batch',
    "I'd like to connect with my mentor / counsellor",
    'My session / lecture is not scheduled or visible',
    'My Zoom authentication access link has expired',
    'My pre-requisite classes are not showing on the LMS',
    'Query related to Terms & Conditions document',
    'Others',
  ],
  'lms-and-platform-support': [
    'Course / content is not visible on the dashboard',
    'Course details are showing incorrectly',
    'I want to update my profile details (phone, address, etc.)',
    "I'm not receiving notifications / emails",
    'I want to report a bug / suggest a feature',
    "I'm facing issues navigating the LMS",
    "I'm not able to access LMS contents",
  ],
  'student-kit-and-delivery-query': [
    "I haven't received my student kit yet",
    'What is the delivery status of my kit',
    'Incorrect details on delivered kit',
    'Damaged or incomplete kit delivered',
    'Request for a soft copy / digital version of my kit',
    'Update my delivery address for the kit',
  ],
  'campus-and-immersion-query': [
    'Unable to attend campus immersion due to a scheduling conflict',
    'Query about campus immersion logistics (travel / accommodation / entry pass etc..)',
    "I haven't received my campus immersion registration confirmation",
    'Query about the campus immersion content / sessions',
  ],
  'certificate-and-placement-query': [
    'My certificate is not received',
    'Query on certificate delivery timeline',
    'Incorrect details on my certificate',
    'Query on my score card / final result',
    'Query on my placement eligibility',
    'Job opportunities not visible on LevelUp platform',
    'LevelUp link not received / access issue',
    'Placement query after course completion',
    'Query on exam timing for placement eligibility',
    'Request to extend my course access',
  ],
  'counselling-support': [
    'Facing academic stress / need mental support',
    'Unable to continue classes — need support',
    'Counselling support for evaluation score dispute',
    'Need help catching up after missed classes',
  ],
  referrals: [
    'My referral reward is delayed / not received',
    'My referral status is stuck on "In Progress"',
    "My friend's enrollment is not reflecting",
    'Courses are not visible in my referral options',
    'My referred friend not contacted / enrolled',
  ],
  'one-on-one-session': ['Request for a One-on-One Session'],
  feedback: ['Feedback'],
  others: ['Others'],
}
