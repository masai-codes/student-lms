import { relations } from 'drizzle-orm/relations'
import {
  lectures,
  aiChatPracticeQuestions,
  users,
  aiTutorSessions,
  announcements,
  announcementReads,
  batches,
  sections,
  assessNpsForm,
  assessNpsSubmissions,
  assignments,
  assignmentProblem,
  problems,
  attendances,
  badges,
  badgeConfigs,
  batchUser,
  bookmarks,
  clubs,
  clubMembers,
  tickets,
  comments,
  discussions,
  events,
  eventEnrollments,
  feedbackBlueprints,
  feedback,
  quizzes,
  helpFaqs,
  interviewSessions,
  lectureFeedback,
  lectureZoomChat,
  lecturesAi,
  masaiverseBanners,
  masaiverseLeaderboard,
  posts,
  replies,
  messages,
  notificationLogs,
  optInChoices,
  profiles,
  sectionUser,
  blocks,
  solutions,
  submissions,
  studentAttendances,
  threads,
  userBadges,
  userBatchAdmissionData,
  userCallbackTickets,
  userDeviceTokens,
  videoAttendances,
  votes,
} from './schema'

export const aiChatPracticeQuestionsRelations = relations(
  aiChatPracticeQuestions,
  ({ one }) => ({
    lecture: one(lectures, {
      fields: [aiChatPracticeQuestions.lectureId],
      references: [lectures.id],
    }),
    user: one(users, {
      fields: [aiChatPracticeQuestions.userId],
      references: [users.id],
    }),
  }),
)

export const lecturesRelations = relations(lectures, ({ one, many }) => ({
  aiChatPracticeQuestions: many(aiChatPracticeQuestions),
  aiTutorSessions: many(aiTutorSessions),
  attendances: many(attendances),
  lectureFeedbacks: many(lectureFeedback),
  lectureZoomChats: many(lectureZoomChat),
  batch: one(batches, {
    fields: [lectures.batchId],
    references: [batches.id],
  }),
  feedback: one(feedback, {
    fields: [lectures.feedbackId],
    references: [feedback.id],
  }),
  user_hostId: one(users, {
    fields: [lectures.hostId],
    references: [users.id],
    relationName: 'lectures_hostId_users_id',
  }),
  section: one(sections, {
    fields: [lectures.sectionId],
    references: [sections.id],
  }),
  user_userId: one(users, {
    fields: [lectures.userId],
    references: [users.id],
    relationName: 'lectures_userId_users_id',
  }),
  lecturesAis: many(lecturesAi),
  studentAttendances: many(studentAttendances),
  videoAttendances: many(videoAttendances),
}))

export const usersRelations = relations(users, ({ many }) => ({
  aiChatPracticeQuestions: many(aiChatPracticeQuestions),
  aiTutorSessions: many(aiTutorSessions),
  announcementReads: many(announcementReads),
  announcements: many(announcements),
  assessNpsForms: many(assessNpsForm),
  assessNpsSubmissions: many(assessNpsSubmissions),
  assignments: many(assignments),
  attendances_hostId: many(attendances, {
    relationName: 'attendances_hostId_users_id',
  }),
  attendances_userId: many(attendances, {
    relationName: 'attendances_userId_users_id',
  }),
  batchUsers: many(batchUser),
  bookmarks: many(bookmarks),
  clubMembers: many(clubMembers),
  clubs: many(clubs),
  comments: many(comments),
  discussions_assigneeId: many(discussions, {
    relationName: 'discussions_assigneeId_users_id',
  }),
  discussions_userId: many(discussions, {
    relationName: 'discussions_userId_users_id',
  }),
  eventEnrollments: many(eventEnrollments),
  events: many(events),
  interviewSessions: many(interviewSessions),
  lectureFeedbacks: many(lectureFeedback),
  lectureZoomChats: many(lectureZoomChat),
  lectures_hostId: many(lectures, {
    relationName: 'lectures_hostId_users_id',
  }),
  lectures_userId: many(lectures, {
    relationName: 'lectures_userId_users_id',
  }),
  masaiverseBanners_createdBy: many(masaiverseBanners, {
    relationName: 'masaiverseBanners_createdBy_users_id',
  }),
  masaiverseBanners_lastEditedBy: many(masaiverseBanners, {
    relationName: 'masaiverseBanners_lastEditedBy_users_id',
  }),
  masaiverseLeaderboards_createdBy: many(masaiverseLeaderboard, {
    relationName: 'masaiverseLeaderboard_createdBy_users_id',
  }),
  masaiverseLeaderboards_userId: many(masaiverseLeaderboard, {
    relationName: 'masaiverseLeaderboard_userId_users_id',
  }),
  messages_authorId: many(messages, {
    relationName: 'messages_authorId_users_id',
  }),
  messages_userId: many(messages, {
    relationName: 'messages_userId_users_id',
  }),
  notificationLogs: many(notificationLogs),
  posts_bannedBy: many(posts, {
    relationName: 'posts_bannedBy_users_id',
  }),
  posts_userId: many(posts, {
    relationName: 'posts_userId_users_id',
  }),
  problems: many(problems),
  profiles: many(profiles),
  quizzes: many(quizzes),
  replies: many(replies),
  sectionUsers_managerId: many(sectionUser, {
    relationName: 'sectionUser_managerId_users_id',
  }),
  sectionUsers_userId: many(sectionUser, {
    relationName: 'sectionUser_userId_users_id',
  }),
  studentAttendances: many(studentAttendances),
  submissions: many(submissions),
  threads: many(threads),
  tickets_agentId: many(tickets, {
    relationName: 'tickets_agentId_users_id',
  }),
  tickets_assigneeId: many(tickets, {
    relationName: 'tickets_assigneeId_users_id',
  }),
  tickets_userId: many(tickets, {
    relationName: 'tickets_userId_users_id',
  }),
  userBadges_createdBy: many(userBadges, {
    relationName: 'userBadges_createdBy_users_id',
  }),
  userBadges_userId: many(userBadges, {
    relationName: 'userBadges_userId_users_id',
  }),
  userBatchAdmissionData: many(userBatchAdmissionData),
  userCallbackTickets_assignedTo: many(userCallbackTickets, {
    relationName: 'userCallbackTickets_assignedTo_users_id',
  }),
  userCallbackTickets_resolvedBy: many(userCallbackTickets, {
    relationName: 'userCallbackTickets_resolvedBy_users_id',
  }),
  userCallbackTickets_userId: many(userCallbackTickets, {
    relationName: 'userCallbackTickets_userId_users_id',
  }),
  userDeviceTokens: many(userDeviceTokens),
  videoAttendances_hostId: many(videoAttendances, {
    relationName: 'videoAttendances_hostId_users_id',
  }),
  videoAttendances_userId: many(videoAttendances, {
    relationName: 'videoAttendances_userId_users_id',
  }),
  votes: many(votes),
}))

export const aiTutorSessionsRelations = relations(
  aiTutorSessions,
  ({ one }) => ({
    lecture: one(lectures, {
      fields: [aiTutorSessions.lectureId],
      references: [lectures.id],
    }),
    user: one(users, {
      fields: [aiTutorSessions.userId],
      references: [users.id],
    }),
  }),
)

export const announcementReadsRelations = relations(
  announcementReads,
  ({ one }) => ({
    announcement: one(announcements, {
      fields: [announcementReads.announcementId],
      references: [announcements.id],
    }),
    user: one(users, {
      fields: [announcementReads.userId],
      references: [users.id],
    }),
  }),
)

export const announcementsRelations = relations(
  announcements,
  ({ one, many }) => ({
    announcementReads: many(announcementReads),
    batch: one(batches, {
      fields: [announcements.batchId],
      references: [batches.id],
    }),
    section: one(sections, {
      fields: [announcements.sectionId],
      references: [sections.id],
    }),
    user: one(users, {
      fields: [announcements.userId],
      references: [users.id],
    }),
  }),
)

export const batchesRelations = relations(batches, ({ many }) => ({
  announcements: many(announcements),
  assessNpsForms: many(assessNpsForm),
  assessNpsSubmissions: many(assessNpsSubmissions),
  assignments: many(assignments),
  attendances: many(attendances),
  badgeConfigs: many(badgeConfigs),
  batchUsers: many(batchUser),
  helpFaqs: many(helpFaqs),
  lectures: many(lectures),
  quizzes: many(quizzes),
  sections: many(sections),
  studentAttendances: many(studentAttendances),
  userBatchAdmissionData: many(userBatchAdmissionData),
  userCallbackTickets: many(userCallbackTickets),
}))

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  announcements: many(announcements),
  assessNpsForms: many(assessNpsForm),
  assessNpsSubmissions: many(assessNpsSubmissions),
  assignments: many(assignments),
  attendances: many(attendances),
  badgeConfigs: many(badgeConfigs),
  lectures: many(lectures),
  optInChoices: many(optInChoices),
  quizzes: many(quizzes),
  sectionUsers: many(sectionUser),
  batch: one(batches, {
    fields: [sections.batchId],
    references: [batches.id],
  }),
  block: one(blocks, {
    fields: [sections.blockId],
    references: [blocks.id],
  }),
  studentAttendances: many(studentAttendances),
}))

export const assessNpsFormRelations = relations(
  assessNpsForm,
  ({ one, many }) => ({
    batch: one(batches, {
      fields: [assessNpsForm.batchId],
      references: [batches.id],
    }),
    section: one(sections, {
      fields: [assessNpsForm.sectionId],
      references: [sections.id],
    }),
    user: one(users, {
      fields: [assessNpsForm.userId],
      references: [users.id],
    }),
    assessNpsSubmissions: many(assessNpsSubmissions),
  }),
)

export const assessNpsSubmissionsRelations = relations(
  assessNpsSubmissions,
  ({ one }) => ({
    batch: one(batches, {
      fields: [assessNpsSubmissions.batchId],
      references: [batches.id],
    }),
    assessNpsForm: one(assessNpsForm, {
      fields: [assessNpsSubmissions.npsFormId],
      references: [assessNpsForm.id],
    }),
    section: one(sections, {
      fields: [assessNpsSubmissions.sectionId],
      references: [sections.id],
    }),
    user: one(users, {
      fields: [assessNpsSubmissions.userId],
      references: [users.id],
    }),
  }),
)

export const assignmentProblemRelations = relations(
  assignmentProblem,
  ({ one }) => ({
    assignment: one(assignments, {
      fields: [assignmentProblem.assignmentId],
      references: [assignments.id],
    }),
    problem: one(problems, {
      fields: [assignmentProblem.problemId],
      references: [problems.id],
    }),
  }),
)

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  assignmentProblems: many(assignmentProblem),
  batch: one(batches, {
    fields: [assignments.batchId],
    references: [batches.id],
  }),
  section: one(sections, {
    fields: [assignments.sectionId],
    references: [sections.id],
  }),
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
  submissions: many(submissions),
}))

export const problemsRelations = relations(problems, ({ one, many }) => ({
  assignmentProblems: many(assignmentProblem),
  user: one(users, {
    fields: [problems.userId],
    references: [users.id],
  }),
  solutions: many(solutions),
}))

export const attendancesRelations = relations(attendances, ({ one }) => ({
  batch: one(batches, {
    fields: [attendances.batchId],
    references: [batches.id],
  }),
  user_hostId: one(users, {
    fields: [attendances.hostId],
    references: [users.id],
    relationName: 'attendances_hostId_users_id',
  }),
  lecture: one(lectures, {
    fields: [attendances.lectureId],
    references: [lectures.id],
  }),
  section: one(sections, {
    fields: [attendances.sectionId],
    references: [sections.id],
  }),
  user_userId: one(users, {
    fields: [attendances.userId],
    references: [users.id],
    relationName: 'attendances_userId_users_id',
  }),
}))

export const badgeConfigsRelations = relations(
  badgeConfigs,
  ({ one, many }) => ({
    badge: one(badges, {
      fields: [badgeConfigs.badgeId],
      references: [badges.id],
    }),
    batch: one(batches, {
      fields: [badgeConfigs.batchId],
      references: [batches.id],
    }),
    section: one(sections, {
      fields: [badgeConfigs.sectionId],
      references: [sections.id],
    }),
    userBadges: many(userBadges),
  }),
)

export const badgesRelations = relations(badges, ({ many }) => ({
  badgeConfigs: many(badgeConfigs),
  userBadges: many(userBadges),
}))

export const batchUserRelations = relations(batchUser, ({ one }) => ({
  batch: one(batches, {
    fields: [batchUser.batchId],
    references: [batches.id],
  }),
  user: one(users, {
    fields: [batchUser.userId],
    references: [users.id],
  }),
}))

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}))

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
}))

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  clubMembers: many(clubMembers),
  user: one(users, {
    fields: [clubs.createdBy],
    references: [users.id],
  }),
  events: many(events),
  masaiverseLeaderboards: many(masaiverseLeaderboard),
  posts: many(posts),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}))

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  comments: many(comments),
  user_agentId: one(users, {
    fields: [tickets.agentId],
    references: [users.id],
    relationName: 'tickets_agentId_users_id',
  }),
  user_assigneeId: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: 'tickets_assigneeId_users_id',
  }),
  user_userId: one(users, {
    fields: [tickets.userId],
    references: [users.id],
    relationName: 'tickets_userId_users_id',
  }),
}))

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  user_assigneeId: one(users, {
    fields: [discussions.assigneeId],
    references: [users.id],
    relationName: 'discussions_assigneeId_users_id',
  }),
  user_userId: one(users, {
    fields: [discussions.userId],
    references: [users.id],
    relationName: 'discussions_userId_users_id',
  }),
  threads: many(threads),
}))

export const eventEnrollmentsRelations = relations(
  eventEnrollments,
  ({ one }) => ({
    event: one(events, {
      fields: [eventEnrollments.eventId],
      references: [events.id],
    }),
    user: one(users, {
      fields: [eventEnrollments.userId],
      references: [users.id],
    }),
  }),
)

export const eventsRelations = relations(events, ({ one, many }) => ({
  eventEnrollments: many(eventEnrollments),
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  masaiverseLeaderboards: many(masaiverseLeaderboard),
}))

export const feedbackRelations = relations(feedback, ({ one, many }) => ({
  feedbackBlueprint: one(feedbackBlueprints, {
    fields: [feedback.feedbackBlueprintId],
    references: [feedbackBlueprints.id],
  }),
  quiz: one(quizzes, {
    fields: [feedback.quizId],
    references: [quizzes.id],
  }),
  lectures: many(lectures),
}))

export const feedbackBlueprintsRelations = relations(
  feedbackBlueprints,
  ({ many }) => ({
    feedbacks: many(feedback),
  }),
)

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  feedbacks: many(feedback),
  batch: one(batches, {
    fields: [quizzes.batchId],
    references: [batches.id],
  }),
  section: one(sections, {
    fields: [quizzes.sectionId],
    references: [sections.id],
  }),
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
}))

export const helpFaqsRelations = relations(helpFaqs, ({ one }) => ({
  batch: one(batches, {
    fields: [helpFaqs.batchId],
    references: [batches.id],
  }),
}))

export const interviewSessionsRelations = relations(
  interviewSessions,
  ({ one }) => ({
    user: one(users, {
      fields: [interviewSessions.userId],
      references: [users.id],
    }),
  }),
)

export const lectureFeedbackRelations = relations(
  lectureFeedback,
  ({ one }) => ({
    lecture: one(lectures, {
      fields: [lectureFeedback.lectureId],
      references: [lectures.id],
    }),
    user: one(users, {
      fields: [lectureFeedback.userId],
      references: [users.id],
    }),
  }),
)

export const lectureZoomChatRelations = relations(
  lectureZoomChat,
  ({ one }) => ({
    user: one(users, {
      fields: [lectureZoomChat.lastEditedBy],
      references: [users.id],
    }),
    lecture: one(lectures, {
      fields: [lectureZoomChat.lectureId],
      references: [lectures.id],
    }),
  }),
)

export const lecturesAiRelations = relations(lecturesAi, ({ one }) => ({
  lecture: one(lectures, {
    fields: [lecturesAi.lectureId],
    references: [lectures.id],
  }),
}))

export const masaiverseBannersRelations = relations(
  masaiverseBanners,
  ({ one }) => ({
    user_createdBy: one(users, {
      fields: [masaiverseBanners.createdBy],
      references: [users.id],
      relationName: 'masaiverseBanners_createdBy_users_id',
    }),
    user_lastEditedBy: one(users, {
      fields: [masaiverseBanners.lastEditedBy],
      references: [users.id],
      relationName: 'masaiverseBanners_lastEditedBy_users_id',
    }),
  }),
)

export const masaiverseLeaderboardRelations = relations(
  masaiverseLeaderboard,
  ({ one }) => ({
    club: one(clubs, {
      fields: [masaiverseLeaderboard.clubId],
      references: [clubs.id],
    }),
    user_createdBy: one(users, {
      fields: [masaiverseLeaderboard.createdBy],
      references: [users.id],
      relationName: 'masaiverseLeaderboard_createdBy_users_id',
    }),
    event: one(events, {
      fields: [masaiverseLeaderboard.eventId],
      references: [events.id],
    }),
    post: one(posts, {
      fields: [masaiverseLeaderboard.postId],
      references: [posts.id],
    }),
    reply: one(replies, {
      fields: [masaiverseLeaderboard.replyId],
      references: [replies.id],
    }),
    user_userId: one(users, {
      fields: [masaiverseLeaderboard.userId],
      references: [users.id],
      relationName: 'masaiverseLeaderboard_userId_users_id',
    }),
  }),
)

export const postsRelations = relations(posts, ({ one, many }) => ({
  masaiverseLeaderboards: many(masaiverseLeaderboard),
  user_bannedBy: one(users, {
    fields: [posts.bannedBy],
    references: [users.id],
    relationName: 'posts_bannedBy_users_id',
  }),
  club: one(clubs, {
    fields: [posts.clubId],
    references: [clubs.id],
  }),
  user_userId: one(users, {
    fields: [posts.userId],
    references: [users.id],
    relationName: 'posts_userId_users_id',
  }),
  replies: many(replies),
  votes: many(votes),
}))

export const repliesRelations = relations(replies, ({ one, many }) => ({
  masaiverseLeaderboards: many(masaiverseLeaderboard),
  post: one(posts, {
    fields: [replies.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [replies.userId],
    references: [users.id],
  }),
  votes: many(votes),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user_authorId: one(users, {
    fields: [messages.authorId],
    references: [users.id],
    relationName: 'messages_authorId_users_id',
  }),
  message: one(messages, {
    fields: [messages.messageId],
    references: [messages.id],
    relationName: 'messages_messageId_messages_id',
  }),
  messages: many(messages, {
    relationName: 'messages_messageId_messages_id',
  }),
  user_userId: one(users, {
    fields: [messages.userId],
    references: [users.id],
    relationName: 'messages_userId_users_id',
  }),
}))

export const notificationLogsRelations = relations(
  notificationLogs,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationLogs.userId],
      references: [users.id],
    }),
  }),
)

export const optInChoicesRelations = relations(
  optInChoices,
  ({ one, many }) => ({
    section: one(sections, {
      fields: [optInChoices.sectionId],
      references: [sections.id],
    }),
    sectionUsers: many(sectionUser),
  }),
)

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}))

export const sectionUserRelations = relations(sectionUser, ({ one }) => ({
  user_managerId: one(users, {
    fields: [sectionUser.managerId],
    references: [users.id],
    relationName: 'sectionUser_managerId_users_id',
  }),
  optInChoice: one(optInChoices, {
    fields: [sectionUser.optInChoiceId],
    references: [optInChoices.id],
  }),
  section: one(sections, {
    fields: [sectionUser.sectionId],
    references: [sections.id],
  }),
  user_userId: one(users, {
    fields: [sectionUser.userId],
    references: [users.id],
    relationName: 'sectionUser_userId_users_id',
  }),
}))

export const blocksRelations = relations(blocks, ({ many }) => ({
  sections: many(sections),
}))

export const solutionsRelations = relations(solutions, ({ one }) => ({
  problem: one(problems, {
    fields: [solutions.problemId],
    references: [problems.id],
  }),
  submission: one(submissions, {
    fields: [solutions.submissionId],
    references: [submissions.id],
  }),
}))

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  solutions: many(solutions),
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}))

export const studentAttendancesRelations = relations(
  studentAttendances,
  ({ one }) => ({
    batch: one(batches, {
      fields: [studentAttendances.batchId],
      references: [batches.id],
    }),
    lecture: one(lectures, {
      fields: [studentAttendances.lectureId],
      references: [lectures.id],
    }),
    section: one(sections, {
      fields: [studentAttendances.sectionId],
      references: [sections.id],
    }),
    user: one(users, {
      fields: [studentAttendances.userId],
      references: [users.id],
    }),
  }),
)

export const threadsRelations = relations(threads, ({ one }) => ({
  discussion: one(discussions, {
    fields: [threads.discussionId],
    references: [discussions.id],
  }),
  user: one(users, {
    fields: [threads.userId],
    references: [users.id],
  }),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  badgeConfig: one(badgeConfigs, {
    fields: [userBadges.badgeConfigId],
    references: [badgeConfigs.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
  user_createdBy: one(users, {
    fields: [userBadges.createdBy],
    references: [users.id],
    relationName: 'userBadges_createdBy_users_id',
  }),
  user_userId: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
    relationName: 'userBadges_userId_users_id',
  }),
}))

export const userBatchAdmissionDataRelations = relations(
  userBatchAdmissionData,
  ({ one }) => ({
    batch: one(batches, {
      fields: [userBatchAdmissionData.batchId],
      references: [batches.id],
    }),
    user: one(users, {
      fields: [userBatchAdmissionData.userId],
      references: [users.id],
    }),
  }),
)

export const userCallbackTicketsRelations = relations(
  userCallbackTickets,
  ({ one }) => ({
    user_assignedTo: one(users, {
      fields: [userCallbackTickets.assignedTo],
      references: [users.id],
      relationName: 'userCallbackTickets_assignedTo_users_id',
    }),
    batch: one(batches, {
      fields: [userCallbackTickets.batchId],
      references: [batches.id],
    }),
    user_resolvedBy: one(users, {
      fields: [userCallbackTickets.resolvedBy],
      references: [users.id],
      relationName: 'userCallbackTickets_resolvedBy_users_id',
    }),
    user_userId: one(users, {
      fields: [userCallbackTickets.userId],
      references: [users.id],
      relationName: 'userCallbackTickets_userId_users_id',
    }),
  }),
)

export const userDeviceTokensRelations = relations(
  userDeviceTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [userDeviceTokens.userId],
      references: [users.id],
    }),
  }),
)

export const videoAttendancesRelations = relations(
  videoAttendances,
  ({ one }) => ({
    user_hostId: one(users, {
      fields: [videoAttendances.hostId],
      references: [users.id],
      relationName: 'videoAttendances_hostId_users_id',
    }),
    lecture: one(lectures, {
      fields: [videoAttendances.lectureId],
      references: [lectures.id],
    }),
    user_userId: one(users, {
      fields: [videoAttendances.userId],
      references: [users.id],
      relationName: 'videoAttendances_userId_users_id',
    }),
  }),
)

export const votesRelations = relations(votes, ({ one }) => ({
  post: one(posts, {
    fields: [votes.postId],
    references: [posts.id],
  }),
  reply: one(replies, {
    fields: [votes.replyId],
    references: [replies.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}))
