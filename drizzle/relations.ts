import { relations } from "drizzle-orm/relations";
import { users, accessLogs, adhocSessions, adhocSessionApprovers, adhocSessionBatches, batches, adhocSessionBlocks, blocks, adhocSessionSections, sections, adhocSessionUsers, adhocSessionBlueprints, lectures, aiChatPracticeQuestions, aiFeedback, aiPracticeQuestions, aiTutorSessions, announcements, attempts, answers, questions, applications, applicationComments, applicationHistories, positions, assignments, assignmentBlueprints, blueprints, assignmentBlueprintsProblems, problems, assignmentProblem, quizzes, attendances, badges, badgeConfigs, batchInfo, batchInfoStages, batchInfoApprovers, batchInfoHistory, batchInfoTemplates, batchInfoTemplateItems, meetings, batchParticipants, batchUser, blockDraftUnitMovements, draftUnitMovements, blockUnitMovementEmails, bookmarks, certificates, clubs, clubMembers, posts, clubPostBookmarks, tickets, comments, disbursalStatuses, discussions, unitMovementRules, payoutCycles, eeCycleRecords, externalEmployees, eeEngagementCosts, eeLeaveRequests, eeOnboardingForm, eePayoutHistories, eeSectionMapping, electives, electiveEntity, electiveProgress, electiveUser, electiveSection, emailNotificationLogs, events, eventEnrollments, companies, externalOffers, leads, feedbackBlueprints, feedback, feedbackQuestionBlueprints, feedbackQuestions, feedbackResponses, flags, flagQuery, queries, githubs, guardian, helpFaqs, instituteBatches, institutes, interactions, interactionMessages, interviews, topicObjectives, learningObjectives, lectureAiGeneratedContent, lectureBlueprints, sectionFeedbackBlueprints, lectureFeedback, lectureInteractions, lectureParticipants, lecturesAi, masaiverseBanners, messages, notes, notificationLogs, npsForms, npsQuestions, npsQuestionResponses, npsSubmissions, optInChoices, participantMetrics, participants, placementStatuses, placementTags, portfolioSubmissions, portfolioFeedback, portfolioStudentIas, positionParams, eligibilities, positionsHistories, practiceInterviews, practiceQuizResponses, practiceTestSubTopics, practiceTestQuestions, practiceTestQuestionsUsersAttempted, practiceTestTopics, problemLinks, profileVerifies, profiles, queryComments, questionQuiz, quizBlueprints, quizBlueprintsQuestions, rbacPermissions, rbacRolePermissions, rbacRoles, rbacUserRoles, replies, scenes, sectionUser, segments, solutions, submissions, studentAttendances, studentTagCategories, studentTagRelation, studentTagNames, studentTagTypes, tasks, teams, teamInvitations, threads, ticketTemplates, menus, unitMovementUserDetails, userBadges, userBatchAdmissionData, userBlockEmails, userCallbackTickets, userCertificates, userDeviceTokens, userDocuments, userGuardian, userRelation, userRelationHistory, userScenes, userSegments, videoAttendances, votes } from "./schema";

export const accessLogsRelations = relations(accessLogs, ({one}) => ({
	user: one(users, {
		fields: [accessLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accessLogs: many(accessLogs),
	adhocSessionApprovers: many(adhocSessionApprovers),
	adhocSessionUsers: many(adhocSessionUsers),
	adhocSessions: many(adhocSessions),
	aiChatPracticeQuestions: many(aiChatPracticeQuestions),
	aiFeedbacks: many(aiFeedback),
	aiPracticeQuestions: many(aiPracticeQuestions),
	aiTutorSessions: many(aiTutorSessions),
	announcements: many(announcements),
	applicationComments: many(applicationComments),
	applicationHistories: many(applicationHistories),
	applications: many(applications),
	assignmentBlueprints: many(assignmentBlueprints),
	assignments: many(assignments),
	attempts: many(attempts),
	attendances_hostId: many(attendances, {
		relationName: "attendances_hostId_users_id"
	}),
	attendances_userId: many(attendances, {
		relationName: "attendances_userId_users_id"
	}),
	batchInfos_checkerId: many(batchInfo, {
		relationName: "batchInfo_checkerId_users_id"
	}),
	batchInfos_makerId: many(batchInfo, {
		relationName: "batchInfo_makerId_users_id"
	}),
	batchInfoApprovers: many(batchInfoApprovers),
	batchInfoHistories: many(batchInfoHistory),
	batchUsers: many(batchUser),
	blockDraftUnitMovements: many(blockDraftUnitMovements),
	blueprints: many(blueprints),
	bookmarks: many(bookmarks),
	certificates: many(certificates),
	clubMembers: many(clubMembers),
	clubPostBookmarks: many(clubPostBookmarks),
	clubs: many(clubs),
	comments: many(comments),
	disbursalStatuses: many(disbursalStatuses),
	discussions_assigneeId: many(discussions, {
		relationName: "discussions_assigneeId_users_id"
	}),
	discussions_userId: many(discussions, {
		relationName: "discussions_userId_users_id"
	}),
	draftUnitMovements: many(draftUnitMovements),
	eeEngagementCosts: many(eeEngagementCosts),
	eeLeaveRequests: many(eeLeaveRequests),
	eeOnboardingForms: many(eeOnboardingForm),
	eePayoutHistories: many(eePayoutHistories),
	eeSectionMappings: many(eeSectionMapping),
	electiveUsers: many(electiveUser),
	electives: many(electives),
	emailNotificationLogs: many(emailNotificationLogs),
	eventEnrollments: many(eventEnrollments),
	events: many(events),
	externalEmployees: many(externalEmployees),
	externalOffers: many(externalOffers),
	feedbackResponses: many(feedbackResponses),
	flags: many(flags),
	githubs: many(githubs),
	guardians: many(guardian),
	interactionMessages: many(interactionMessages),
	interactions: many(interactions),
	interviews_createdBy: many(interviews, {
		relationName: "interviews_createdBy_users_id"
	}),
	interviews_userId: many(interviews, {
		relationName: "interviews_userId_users_id"
	}),
	leads: many(leads),
	lectureBlueprints: many(lectureBlueprints),
	lectureFeedbacks: many(lectureFeedback),
	lectureInteractions: many(lectureInteractions),
	lectureParticipants: many(lectureParticipants),
	lectures_hostId: many(lectures, {
		relationName: "lectures_hostId_users_id"
	}),
	lectures_userId: many(lectures, {
		relationName: "lectures_userId_users_id"
	}),
	masaiverseBanners_createdBy: many(masaiverseBanners, {
		relationName: "masaiverseBanners_createdBy_users_id"
	}),
	masaiverseBanners_lastEditedBy: many(masaiverseBanners, {
		relationName: "masaiverseBanners_lastEditedBy_users_id"
	}),
	messages_authorId: many(messages, {
		relationName: "messages_authorId_users_id"
	}),
	messages_userId: many(messages, {
		relationName: "messages_userId_users_id"
	}),
	notes: many(notes),
	notificationLogs: many(notificationLogs),
	npsForms: many(npsForms),
	npsSubmissions: many(npsSubmissions),
	payoutCycles: many(payoutCycles),
	placementStatuses: many(placementStatuses),
	placementTags: many(placementTags),
	portfolioFeedbacks: many(portfolioFeedback),
	portfolioStudentIas_iaId: many(portfolioStudentIas, {
		relationName: "portfolioStudentIas_iaId_users_id"
	}),
	portfolioStudentIas_studentId: many(portfolioStudentIas, {
		relationName: "portfolioStudentIas_studentId_users_id"
	}),
	portfolioSubmissions: many(portfolioSubmissions),
	positions: many(positions),
	positionsHistories: many(positionsHistories),
	posts_bannedBy: many(posts, {
		relationName: "posts_bannedBy_users_id"
	}),
	posts_userId: many(posts, {
		relationName: "posts_userId_users_id"
	}),
	practiceInterviews: many(practiceInterviews),
	practiceQuizResponses: many(practiceQuizResponses),
	practiceTestQuestionsUsersAttempteds: many(practiceTestQuestionsUsersAttempted),
	problems: many(problems),
	profileVerifies_createdBy: many(profileVerifies, {
		relationName: "profileVerifies_createdBy_users_id"
	}),
	profileVerifies_rejectedBy: many(profileVerifies, {
		relationName: "profileVerifies_rejectedBy_users_id"
	}),
	profileVerifies_userId: many(profileVerifies, {
		relationName: "profileVerifies_userId_users_id"
	}),
	profileVerifies_verifiedBy: many(profileVerifies, {
		relationName: "profileVerifies_verifiedBy_users_id"
	}),
	profiles: many(profiles),
	queries: many(queries),
	queryComments: many(queryComments),
	questions: many(questions),
	quizBlueprints: many(quizBlueprints),
	quizzes: many(quizzes),
	rbacRoles: many(rbacRoles),
	rbacUserRoles_assignedBy: many(rbacUserRoles, {
		relationName: "rbacUserRoles_assignedBy_users_id"
	}),
	rbacUserRoles_userId: many(rbacUserRoles, {
		relationName: "rbacUserRoles_userId_users_id"
	}),
	replies: many(replies),
	sectionUsers_managerId: many(sectionUser, {
		relationName: "sectionUser_managerId_users_id"
	}),
	sectionUsers_userId: many(sectionUser, {
		relationName: "sectionUser_userId_users_id"
	}),
	studentAttendances: many(studentAttendances),
	studentTagRelations: many(studentTagRelation),
	submissions: many(submissions),
	tasks: many(tasks),
	threads: many(threads),
	ticketTemplates_createdBy: many(ticketTemplates, {
		relationName: "ticketTemplates_createdBy_users_id"
	}),
	ticketTemplates_updatedBy: many(ticketTemplates, {
		relationName: "ticketTemplates_updatedBy_users_id"
	}),
	tickets_agentId: many(tickets, {
		relationName: "tickets_agentId_users_id"
	}),
	tickets_assigneeId: many(tickets, {
		relationName: "tickets_assigneeId_users_id"
	}),
	tickets_userId: many(tickets, {
		relationName: "tickets_userId_users_id"
	}),
	unitMovementUserDetails: many(unitMovementUserDetails),
	userBadges_createdBy: many(userBadges, {
		relationName: "userBadges_createdBy_users_id"
	}),
	userBadges_userId: many(userBadges, {
		relationName: "userBadges_userId_users_id"
	}),
	userBatchAdmissionData: many(userBatchAdmissionData),
	userBlockEmails: many(userBlockEmails),
	userCallbackTickets_assignedTo: many(userCallbackTickets, {
		relationName: "userCallbackTickets_assignedTo_users_id"
	}),
	userCallbackTickets_resolvedBy: many(userCallbackTickets, {
		relationName: "userCallbackTickets_resolvedBy_users_id"
	}),
	userCallbackTickets_userId: many(userCallbackTickets, {
		relationName: "userCallbackTickets_userId_users_id"
	}),
	userCertificates: many(userCertificates),
	userDeviceTokens: many(userDeviceTokens),
	userDocuments: many(userDocuments),
	userGuardians: many(userGuardian),
	userRelations: many(userRelation),
	userRelationHistories: many(userRelationHistory),
	userScenes: many(userScenes),
	userSegments: many(userSegments),
	videoAttendances_hostId: many(videoAttendances, {
		relationName: "videoAttendances_hostId_users_id"
	}),
	videoAttendances_userId: many(videoAttendances, {
		relationName: "videoAttendances_userId_users_id"
	}),
	votes: many(votes),
}));

export const adhocSessionApproversRelations = relations(adhocSessionApprovers, ({one}) => ({
	adhocSession: one(adhocSessions, {
		fields: [adhocSessionApprovers.adhocSessionId],
		references: [adhocSessions.id]
	}),
	user: one(users, {
		fields: [adhocSessionApprovers.userId],
		references: [users.id]
	}),
}));

export const adhocSessionsRelations = relations(adhocSessions, ({one, many}) => ({
	adhocSessionApprovers: many(adhocSessionApprovers),
	adhocSessionBatches: many(adhocSessionBatches),
	adhocSessionBlocks: many(adhocSessionBlocks),
	adhocSessionSections: many(adhocSessionSections),
	adhocSessionUsers: many(adhocSessionUsers),
	adhocSessionBlueprint: one(adhocSessionBlueprints, {
		fields: [adhocSessions.adhocSessionBlueprintId],
		references: [adhocSessionBlueprints.id]
	}),
	user: one(users, {
		fields: [adhocSessions.userId],
		references: [users.id]
	}),
}));

export const adhocSessionBatchesRelations = relations(adhocSessionBatches, ({one}) => ({
	adhocSession: one(adhocSessions, {
		fields: [adhocSessionBatches.adhocSessionId],
		references: [adhocSessions.id]
	}),
	batch: one(batches, {
		fields: [adhocSessionBatches.batchId],
		references: [batches.id]
	}),
}));

export const batchesRelations = relations(batches, ({many}) => ({
	adhocSessionBatches: many(adhocSessionBatches),
	announcements: many(announcements),
	assignments: many(assignments),
	attendances: many(attendances),
	badgeConfigs: many(badgeConfigs),
	batchInfos: many(batchInfo),
	batchInfoHistories: many(batchInfoHistory),
	batchInfoStages: many(batchInfoStages),
	batchUsers: many(batchUser),
	eeSectionMappings: many(eeSectionMapping),
	electiveSections: many(electiveSection),
	flags: many(flags),
	helpFaqs: many(helpFaqs),
	instituteBatches: many(instituteBatches),
	lectures: many(lectures),
	npsForms: many(npsForms),
	queries: many(queries),
	quizzes: many(quizzes),
	rbacUserRoles: many(rbacUserRoles),
	sections: many(sections),
	studentAttendances: many(studentAttendances),
	tasks: many(tasks),
	userBatchAdmissionData: many(userBatchAdmissionData),
	userCallbackTickets: many(userCallbackTickets),
	userCertificates: many(userCertificates),
}));

export const adhocSessionBlocksRelations = relations(adhocSessionBlocks, ({one}) => ({
	adhocSession: one(adhocSessions, {
		fields: [adhocSessionBlocks.adhocSessionId],
		references: [adhocSessions.id]
	}),
	block: one(blocks, {
		fields: [adhocSessionBlocks.blockId],
		references: [blocks.id]
	}),
}));

export const blocksRelations = relations(blocks, ({many}) => ({
	adhocSessionBlocks: many(adhocSessionBlocks),
	blockDraftUnitMovements: many(blockDraftUnitMovements),
	blockUnitMovementEmails: many(blockUnitMovementEmails),
	sections: many(sections),
	userBlockEmails: many(userBlockEmails),
}));

export const adhocSessionSectionsRelations = relations(adhocSessionSections, ({one}) => ({
	adhocSession: one(adhocSessions, {
		fields: [adhocSessionSections.adhocSessionId],
		references: [adhocSessions.id]
	}),
	section: one(sections, {
		fields: [adhocSessionSections.sectionId],
		references: [sections.id]
	}),
}));

export const sectionsRelations = relations(sections, ({one, many}) => ({
	adhocSessionSections: many(adhocSessionSections),
	announcements: many(announcements),
	assignments: many(assignments),
	attendances: many(attendances),
	badgeConfigs: many(badgeConfigs),
	blockDraftUnitMovements_newSectionId: many(blockDraftUnitMovements, {
		relationName: "blockDraftUnitMovements_newSectionId_sections_id"
	}),
	blockDraftUnitMovements_sectionId: many(blockDraftUnitMovements, {
		relationName: "blockDraftUnitMovements_sectionId_sections_id"
	}),
	blueprints: many(blueprints),
	certificates: many(certificates),
	draftUnitMovements_newSectionId: many(draftUnitMovements, {
		relationName: "draftUnitMovements_newSectionId_sections_id"
	}),
	draftUnitMovements_sectionId: many(draftUnitMovements, {
		relationName: "draftUnitMovements_sectionId_sections_id"
	}),
	eeSectionMappings: many(eeSectionMapping),
	electiveSections: many(electiveSection),
	flags: many(flags),
	lectures: many(lectures),
	npsForms: many(npsForms),
	optInChoices: many(optInChoices),
	queries: many(queries),
	quizzes: many(quizzes),
	rbacUserRoles: many(rbacUserRoles),
	sectionUsers: many(sectionUser),
	batch: one(batches, {
		fields: [sections.batchId],
		references: [batches.id]
	}),
	block: one(blocks, {
		fields: [sections.blockId],
		references: [blocks.id]
	}),
	studentAttendances: many(studentAttendances),
	unitMovementRules_newSectionId: many(unitMovementRules, {
		relationName: "unitMovementRules_newSectionId_sections_id"
	}),
	unitMovementRules_sectionId: many(unitMovementRules, {
		relationName: "unitMovementRules_sectionId_sections_id"
	}),
	unitMovementUserDetails: many(unitMovementUserDetails),
	userRelations: many(userRelation),
}));

export const adhocSessionUsersRelations = relations(adhocSessionUsers, ({one}) => ({
	adhocSession: one(adhocSessions, {
		fields: [adhocSessionUsers.adhocSessionId],
		references: [adhocSessions.id]
	}),
	user: one(users, {
		fields: [adhocSessionUsers.userId],
		references: [users.id]
	}),
}));

export const adhocSessionBlueprintsRelations = relations(adhocSessionBlueprints, ({many}) => ({
	adhocSessions: many(adhocSessions),
}));

export const aiChatPracticeQuestionsRelations = relations(aiChatPracticeQuestions, ({one}) => ({
	lecture: one(lectures, {
		fields: [aiChatPracticeQuestions.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [aiChatPracticeQuestions.userId],
		references: [users.id]
	}),
}));

export const lecturesRelations = relations(lectures, ({one, many}) => ({
	aiChatPracticeQuestions: many(aiChatPracticeQuestions),
	aiFeedbacks: many(aiFeedback),
	aiPracticeQuestions: many(aiPracticeQuestions),
	aiTutorSessions: many(aiTutorSessions),
	attendances: many(attendances),
	eePayoutHistories: many(eePayoutHistories),
	lectureAiGeneratedContents: many(lectureAiGeneratedContent),
	lectureBlueprints: many(lectureBlueprints),
	lectureFeedbacks: many(lectureFeedback),
	lectureInteractions: many(lectureInteractions),
	lectureParticipants: many(lectureParticipants),
	batch: one(batches, {
		fields: [lectures.batchId],
		references: [batches.id]
	}),
	feedback: one(feedback, {
		fields: [lectures.feedbackId],
		references: [feedback.id]
	}),
	user_hostId: one(users, {
		fields: [lectures.hostId],
		references: [users.id],
		relationName: "lectures_hostId_users_id"
	}),
	section: one(sections, {
		fields: [lectures.sectionId],
		references: [sections.id]
	}),
	user_userId: one(users, {
		fields: [lectures.userId],
		references: [users.id],
		relationName: "lectures_userId_users_id"
	}),
	lecturesAis: many(lecturesAi),
	meetings: many(meetings),
	scenes: many(scenes),
	studentAttendances: many(studentAttendances),
	videoAttendances: many(videoAttendances),
}));

export const aiFeedbackRelations = relations(aiFeedback, ({one}) => ({
	lecture: one(lectures, {
		fields: [aiFeedback.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [aiFeedback.userId],
		references: [users.id]
	}),
}));

export const aiPracticeQuestionsRelations = relations(aiPracticeQuestions, ({one}) => ({
	lecture: one(lectures, {
		fields: [aiPracticeQuestions.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [aiPracticeQuestions.userId],
		references: [users.id]
	}),
}));

export const aiTutorSessionsRelations = relations(aiTutorSessions, ({one}) => ({
	lecture: one(lectures, {
		fields: [aiTutorSessions.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [aiTutorSessions.userId],
		references: [users.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	batch: one(batches, {
		fields: [announcements.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [announcements.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [announcements.userId],
		references: [users.id]
	}),
}));

export const answersRelations = relations(answers, ({one}) => ({
	attempt: one(attempts, {
		fields: [answers.attemptId],
		references: [attempts.id]
	}),
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
}));

export const attemptsRelations = relations(attempts, ({one, many}) => ({
	answers: many(answers),
	quiz: one(quizzes, {
		fields: [attempts.quizId],
		references: [quizzes.id]
	}),
	user: one(users, {
		fields: [attempts.userId],
		references: [users.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	answers: many(answers),
	questionQuizs: many(questionQuiz),
	user: one(users, {
		fields: [questions.userId],
		references: [users.id]
	}),
	quizBlueprintsQuestions: many(quizBlueprintsQuestions),
}));

export const applicationCommentsRelations = relations(applicationComments, ({one}) => ({
	application: one(applications, {
		fields: [applicationComments.applicationId],
		references: [applications.id]
	}),
	user: one(users, {
		fields: [applicationComments.userId],
		references: [users.id]
	}),
}));

export const applicationsRelations = relations(applications, ({one, many}) => ({
	applicationComments: many(applicationComments),
	applicationHistories: many(applicationHistories),
	position: one(positions, {
		fields: [applications.positionId],
		references: [positions.id]
	}),
	user: one(users, {
		fields: [applications.userId],
		references: [users.id]
	}),
	interviews: many(interviews),
}));

export const applicationHistoriesRelations = relations(applicationHistories, ({one}) => ({
	application: one(applications, {
		fields: [applicationHistories.applicationId],
		references: [applications.id]
	}),
	user: one(users, {
		fields: [applicationHistories.userId],
		references: [users.id]
	}),
}));

export const positionsRelations = relations(positions, ({one, many}) => ({
	applications: many(applications),
	positionParams: many(positionParams),
	company: one(companies, {
		fields: [positions.companyId],
		references: [companies.id]
	}),
	eligibility: one(eligibilities, {
		fields: [positions.eligibilityId],
		references: [eligibilities.id]
	}),
	user: one(users, {
		fields: [positions.userId],
		references: [users.id]
	}),
	positionsHistories: many(positionsHistories),
}));

export const assignmentBlueprintsRelations = relations(assignmentBlueprints, ({one, many}) => ({
	assignment: one(assignments, {
		fields: [assignmentBlueprints.assignmentId],
		references: [assignments.id]
	}),
	blueprint: one(blueprints, {
		fields: [assignmentBlueprints.blueprintId],
		references: [blueprints.id]
	}),
	user: one(users, {
		fields: [assignmentBlueprints.userId],
		references: [users.id]
	}),
	assignmentBlueprintsProblems: many(assignmentBlueprintsProblems),
}));

export const assignmentsRelations = relations(assignments, ({one, many}) => ({
	assignmentBlueprints: many(assignmentBlueprints),
	assignmentProblems: many(assignmentProblem),
	batch: one(batches, {
		fields: [assignments.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [assignments.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [assignments.userId],
		references: [users.id]
	}),
	problemLinks: many(problemLinks),
	submissions: many(submissions),
}));

export const blueprintsRelations = relations(blueprints, ({one, many}) => ({
	assignmentBlueprints: many(assignmentBlueprints),
	section: one(sections, {
		fields: [blueprints.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [blueprints.userId],
		references: [users.id]
	}),
	lectureBlueprints: many(lectureBlueprints),
	quizBlueprints: many(quizBlueprints),
	sectionFeedbackBlueprints: many(sectionFeedbackBlueprints),
}));

export const assignmentBlueprintsProblemsRelations = relations(assignmentBlueprintsProblems, ({one}) => ({
	assignmentBlueprint: one(assignmentBlueprints, {
		fields: [assignmentBlueprintsProblems.assignmentBlueprintId],
		references: [assignmentBlueprints.id]
	}),
	problem: one(problems, {
		fields: [assignmentBlueprintsProblems.problemId],
		references: [problems.id]
	}),
}));

export const problemsRelations = relations(problems, ({one, many}) => ({
	assignmentBlueprintsProblems: many(assignmentBlueprintsProblems),
	assignmentProblems: many(assignmentProblem),
	problemLinks: many(problemLinks),
	user: one(users, {
		fields: [problems.userId],
		references: [users.id]
	}),
	solutions: many(solutions),
}));

export const assignmentProblemRelations = relations(assignmentProblem, ({one}) => ({
	assignment: one(assignments, {
		fields: [assignmentProblem.assignmentId],
		references: [assignments.id]
	}),
	problem: one(problems, {
		fields: [assignmentProblem.problemId],
		references: [problems.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	attempts: many(attempts),
	feedbacks: many(feedback),
	questionQuizs: many(questionQuiz),
	quizBlueprints: many(quizBlueprints),
	batch: one(batches, {
		fields: [quizzes.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [quizzes.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [quizzes.userId],
		references: [users.id]
	}),
	sectionFeedbackBlueprints: many(sectionFeedbackBlueprints),
}));

export const attendancesRelations = relations(attendances, ({one}) => ({
	batch: one(batches, {
		fields: [attendances.batchId],
		references: [batches.id]
	}),
	user_hostId: one(users, {
		fields: [attendances.hostId],
		references: [users.id],
		relationName: "attendances_hostId_users_id"
	}),
	lecture: one(lectures, {
		fields: [attendances.lectureId],
		references: [lectures.id]
	}),
	section: one(sections, {
		fields: [attendances.sectionId],
		references: [sections.id]
	}),
	user_userId: one(users, {
		fields: [attendances.userId],
		references: [users.id],
		relationName: "attendances_userId_users_id"
	}),
}));

export const badgeConfigsRelations = relations(badgeConfigs, ({one, many}) => ({
	badge: one(badges, {
		fields: [badgeConfigs.badgeId],
		references: [badges.id]
	}),
	batch: one(batches, {
		fields: [badgeConfigs.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [badgeConfigs.sectionId],
		references: [sections.id]
	}),
	userBadges: many(userBadges),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	badgeConfigs: many(badgeConfigs),
	userBadges: many(userBadges),
}));

export const batchInfoRelations = relations(batchInfo, ({one}) => ({
	batch: one(batches, {
		fields: [batchInfo.batchId],
		references: [batches.id]
	}),
	user_checkerId: one(users, {
		fields: [batchInfo.checkerId],
		references: [users.id],
		relationName: "batchInfo_checkerId_users_id"
	}),
	user_makerId: one(users, {
		fields: [batchInfo.makerId],
		references: [users.id],
		relationName: "batchInfo_makerId_users_id"
	}),
	batchInfoStage: one(batchInfoStages, {
		fields: [batchInfo.stageId],
		references: [batchInfoStages.id]
	}),
}));

export const batchInfoStagesRelations = relations(batchInfoStages, ({one, many}) => ({
	batchInfos: many(batchInfo),
	batchInfoApprovers: many(batchInfoApprovers),
	batch: one(batches, {
		fields: [batchInfoStages.batchId],
		references: [batches.id]
	}),
}));

export const batchInfoApproversRelations = relations(batchInfoApprovers, ({one}) => ({
	batchInfoStage: one(batchInfoStages, {
		fields: [batchInfoApprovers.stageId],
		references: [batchInfoStages.id]
	}),
	user: one(users, {
		fields: [batchInfoApprovers.userId],
		references: [users.id]
	}),
}));

export const batchInfoHistoryRelations = relations(batchInfoHistory, ({one}) => ({
	batch: one(batches, {
		fields: [batchInfoHistory.batchId],
		references: [batches.id]
	}),
	user: one(users, {
		fields: [batchInfoHistory.userId],
		references: [users.id]
	}),
}));

export const batchInfoTemplateItemsRelations = relations(batchInfoTemplateItems, ({one}) => ({
	batchInfoTemplate: one(batchInfoTemplates, {
		fields: [batchInfoTemplateItems.batchInfoTemplateId],
		references: [batchInfoTemplates.id]
	}),
}));

export const batchInfoTemplatesRelations = relations(batchInfoTemplates, ({many}) => ({
	batchInfoTemplateItems: many(batchInfoTemplateItems),
}));

export const batchParticipantsRelations = relations(batchParticipants, ({one}) => ({
	meeting: one(meetings, {
		fields: [batchParticipants.lectureId],
		references: [meetings.lectureId]
	}),
}));

export const meetingsRelations = relations(meetings, ({one, many}) => ({
	batchParticipants: many(batchParticipants),
	lecture: one(lectures, {
		fields: [meetings.lectureId],
		references: [lectures.id]
	}),
	participantMetrics: many(participantMetrics),
	participants: many(participants),
}));

export const batchUserRelations = relations(batchUser, ({one}) => ({
	batch: one(batches, {
		fields: [batchUser.batchId],
		references: [batches.id]
	}),
	user: one(users, {
		fields: [batchUser.userId],
		references: [users.id]
	}),
}));

export const blockDraftUnitMovementsRelations = relations(blockDraftUnitMovements, ({one}) => ({
	block: one(blocks, {
		fields: [blockDraftUnitMovements.blockId],
		references: [blocks.id]
	}),
	draftUnitMovement: one(draftUnitMovements, {
		fields: [blockDraftUnitMovements.draftUnitMovementId],
		references: [draftUnitMovements.id]
	}),
	section_newSectionId: one(sections, {
		fields: [blockDraftUnitMovements.newSectionId],
		references: [sections.id],
		relationName: "blockDraftUnitMovements_newSectionId_sections_id"
	}),
	section_sectionId: one(sections, {
		fields: [blockDraftUnitMovements.sectionId],
		references: [sections.id],
		relationName: "blockDraftUnitMovements_sectionId_sections_id"
	}),
	user: one(users, {
		fields: [blockDraftUnitMovements.userId],
		references: [users.id]
	}),
}));

export const draftUnitMovementsRelations = relations(draftUnitMovements, ({one, many}) => ({
	blockDraftUnitMovements: many(blockDraftUnitMovements),
	section_newSectionId: one(sections, {
		fields: [draftUnitMovements.newSectionId],
		references: [sections.id],
		relationName: "draftUnitMovements_newSectionId_sections_id"
	}),
	section_sectionId: one(sections, {
		fields: [draftUnitMovements.sectionId],
		references: [sections.id],
		relationName: "draftUnitMovements_sectionId_sections_id"
	}),
	unitMovementRule: one(unitMovementRules, {
		fields: [draftUnitMovements.unitMovementRuleId],
		references: [unitMovementRules.id]
	}),
	user: one(users, {
		fields: [draftUnitMovements.userId],
		references: [users.id]
	}),
}));

export const blockUnitMovementEmailsRelations = relations(blockUnitMovementEmails, ({one, many}) => ({
	block: one(blocks, {
		fields: [blockUnitMovementEmails.blockId],
		references: [blocks.id]
	}),
	userBlockEmails: many(userBlockEmails),
}));

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	user: one(users, {
		fields: [bookmarks.userId],
		references: [users.id]
	}),
}));

export const certificatesRelations = relations(certificates, ({one}) => ({
	section: one(sections, {
		fields: [certificates.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [certificates.userId],
		references: [users.id]
	}),
}));

export const clubMembersRelations = relations(clubMembers, ({one}) => ({
	club: one(clubs, {
		fields: [clubMembers.clubId],
		references: [clubs.id]
	}),
	user: one(users, {
		fields: [clubMembers.userId],
		references: [users.id]
	}),
}));

export const clubsRelations = relations(clubs, ({one, many}) => ({
	clubMembers: many(clubMembers),
	user: one(users, {
		fields: [clubs.createdBy],
		references: [users.id]
	}),
	events: many(events),
	posts: many(posts),
}));

export const clubPostBookmarksRelations = relations(clubPostBookmarks, ({one}) => ({
	post: one(posts, {
		fields: [clubPostBookmarks.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [clubPostBookmarks.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	clubPostBookmarks: many(clubPostBookmarks),
	user_bannedBy: one(users, {
		fields: [posts.bannedBy],
		references: [users.id],
		relationName: "posts_bannedBy_users_id"
	}),
	club: one(clubs, {
		fields: [posts.clubId],
		references: [clubs.id]
	}),
	user_userId: one(users, {
		fields: [posts.userId],
		references: [users.id],
		relationName: "posts_userId_users_id"
	}),
	replies: many(replies),
	votes: many(votes),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	ticket: one(tickets, {
		fields: [comments.ticketId],
		references: [tickets.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	comments: many(comments),
	interactions: many(interactions),
	user_agentId: one(users, {
		fields: [tickets.agentId],
		references: [users.id],
		relationName: "tickets_agentId_users_id"
	}),
	user_assigneeId: one(users, {
		fields: [tickets.assigneeId],
		references: [users.id],
		relationName: "tickets_assigneeId_users_id"
	}),
	user_userId: one(users, {
		fields: [tickets.userId],
		references: [users.id],
		relationName: "tickets_userId_users_id"
	}),
}));

export const disbursalStatusesRelations = relations(disbursalStatuses, ({one}) => ({
	user: one(users, {
		fields: [disbursalStatuses.userId],
		references: [users.id]
	}),
}));

export const discussionsRelations = relations(discussions, ({one, many}) => ({
	user_assigneeId: one(users, {
		fields: [discussions.assigneeId],
		references: [users.id],
		relationName: "discussions_assigneeId_users_id"
	}),
	user_userId: one(users, {
		fields: [discussions.userId],
		references: [users.id],
		relationName: "discussions_userId_users_id"
	}),
	threads: many(threads),
}));

export const unitMovementRulesRelations = relations(unitMovementRules, ({one, many}) => ({
	draftUnitMovements: many(draftUnitMovements),
	section_newSectionId: one(sections, {
		fields: [unitMovementRules.newSectionId],
		references: [sections.id],
		relationName: "unitMovementRules_newSectionId_sections_id"
	}),
	optInChoice: one(optInChoices, {
		fields: [unitMovementRules.optInChoiceId],
		references: [optInChoices.id]
	}),
	section_sectionId: one(sections, {
		fields: [unitMovementRules.sectionId],
		references: [sections.id],
		relationName: "unitMovementRules_sectionId_sections_id"
	}),
}));

export const eeCycleRecordsRelations = relations(eeCycleRecords, ({one}) => ({
	payoutCycle: one(payoutCycles, {
		fields: [eeCycleRecords.cycleId],
		references: [payoutCycles.id]
	}),
	externalEmployee: one(externalEmployees, {
		fields: [eeCycleRecords.eeId],
		references: [externalEmployees.id]
	}),
}));

export const payoutCyclesRelations = relations(payoutCycles, ({one, many}) => ({
	eeCycleRecords: many(eeCycleRecords),
	user: one(users, {
		fields: [payoutCycles.createdBy],
		references: [users.id]
	}),
}));

export const externalEmployeesRelations = relations(externalEmployees, ({one, many}) => ({
	eeCycleRecords: many(eeCycleRecords),
	eeEngagementCosts: many(eeEngagementCosts),
	eeLeaveRequests: many(eeLeaveRequests),
	eeOnboardingForms: many(eeOnboardingForm),
	eePayoutHistories: many(eePayoutHistories),
	eeSectionMappings: many(eeSectionMapping),
	user: one(users, {
		fields: [externalEmployees.userId],
		references: [users.id]
	}),
	lectureParticipants: many(lectureParticipants),
}));

export const eeEngagementCostsRelations = relations(eeEngagementCosts, ({one}) => ({
	externalEmployee: one(externalEmployees, {
		fields: [eeEngagementCosts.eeId],
		references: [externalEmployees.id]
	}),
	user: one(users, {
		fields: [eeEngagementCosts.userId],
		references: [users.id]
	}),
}));

export const eeLeaveRequestsRelations = relations(eeLeaveRequests, ({one}) => ({
	user: one(users, {
		fields: [eeLeaveRequests.approvedBy],
		references: [users.id]
	}),
	externalEmployee: one(externalEmployees, {
		fields: [eeLeaveRequests.eeId],
		references: [externalEmployees.id]
	}),
}));

export const eeOnboardingFormRelations = relations(eeOnboardingForm, ({one}) => ({
	externalEmployee: one(externalEmployees, {
		fields: [eeOnboardingForm.eeId],
		references: [externalEmployees.id]
	}),
	user: one(users, {
		fields: [eeOnboardingForm.userId],
		references: [users.id]
	}),
}));

export const eePayoutHistoriesRelations = relations(eePayoutHistories, ({one}) => ({
	externalEmployee: one(externalEmployees, {
		fields: [eePayoutHistories.eeId],
		references: [externalEmployees.id]
	}),
	lecture: one(lectures, {
		fields: [eePayoutHistories.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [eePayoutHistories.userId],
		references: [users.id]
	}),
}));

export const eeSectionMappingRelations = relations(eeSectionMapping, ({one}) => ({
	batch: one(batches, {
		fields: [eeSectionMapping.batchId],
		references: [batches.id]
	}),
	user: one(users, {
		fields: [eeSectionMapping.createdBy],
		references: [users.id]
	}),
	externalEmployee: one(externalEmployees, {
		fields: [eeSectionMapping.eeId],
		references: [externalEmployees.id]
	}),
	section: one(sections, {
		fields: [eeSectionMapping.sectionId],
		references: [sections.id]
	}),
}));

export const electiveEntityRelations = relations(electiveEntity, ({one, many}) => ({
	elective: one(electives, {
		fields: [electiveEntity.electiveId],
		references: [electives.id]
	}),
	electiveProgresses: many(electiveProgress),
}));

export const electivesRelations = relations(electives, ({one, many}) => ({
	electiveEntities: many(electiveEntity),
	electiveSections: many(electiveSection),
	electiveUsers: many(electiveUser),
	user: one(users, {
		fields: [electives.userId],
		references: [users.id]
	}),
}));

export const electiveProgressRelations = relations(electiveProgress, ({one}) => ({
	electiveEntity: one(electiveEntity, {
		fields: [electiveProgress.electiveEntityId],
		references: [electiveEntity.id]
	}),
	electiveUser: one(electiveUser, {
		fields: [electiveProgress.electiveUserId],
		references: [electiveUser.id]
	}),
}));

export const electiveUserRelations = relations(electiveUser, ({one, many}) => ({
	electiveProgresses: many(electiveProgress),
	elective: one(electives, {
		fields: [electiveUser.electiveId],
		references: [electives.id]
	}),
	user: one(users, {
		fields: [electiveUser.userId],
		references: [users.id]
	}),
}));

export const electiveSectionRelations = relations(electiveSection, ({one}) => ({
	batch: one(batches, {
		fields: [electiveSection.batchId],
		references: [batches.id]
	}),
	elective: one(electives, {
		fields: [electiveSection.electiveId],
		references: [electives.id]
	}),
	section: one(sections, {
		fields: [electiveSection.sectionId],
		references: [sections.id]
	}),
}));

export const emailNotificationLogsRelations = relations(emailNotificationLogs, ({one}) => ({
	user: one(users, {
		fields: [emailNotificationLogs.userId],
		references: [users.id]
	}),
}));

export const eventEnrollmentsRelations = relations(eventEnrollments, ({one}) => ({
	event: one(events, {
		fields: [eventEnrollments.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [eventEnrollments.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventEnrollments: many(eventEnrollments),
	club: one(clubs, {
		fields: [events.clubId],
		references: [clubs.id]
	}),
	user: one(users, {
		fields: [events.createdBy],
		references: [users.id]
	}),
}));

export const externalOffersRelations = relations(externalOffers, ({one}) => ({
	company: one(companies, {
		fields: [externalOffers.companyId],
		references: [companies.id]
	}),
	lead: one(leads, {
		fields: [externalOffers.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [externalOffers.userId],
		references: [users.id]
	}),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	externalOffers: many(externalOffers),
	positions: many(positions),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	externalOffers: many(externalOffers),
	user: one(users, {
		fields: [leads.userId],
		references: [users.id]
	}),
}));

export const feedbackRelations = relations(feedback, ({one, many}) => ({
	feedbackBlueprint: one(feedbackBlueprints, {
		fields: [feedback.feedbackBlueprintId],
		references: [feedbackBlueprints.id]
	}),
	quiz: one(quizzes, {
		fields: [feedback.quizId],
		references: [quizzes.id]
	}),
	feedbackQuestions: many(feedbackQuestions),
	feedbackResponses: many(feedbackResponses),
	lectures: many(lectures),
	sectionFeedbackBlueprints: many(sectionFeedbackBlueprints),
}));

export const feedbackBlueprintsRelations = relations(feedbackBlueprints, ({many}) => ({
	feedbacks: many(feedback),
	feedbackQuestionBlueprints: many(feedbackQuestionBlueprints),
	sectionFeedbackBlueprints: many(sectionFeedbackBlueprints),
}));

export const feedbackQuestionBlueprintsRelations = relations(feedbackQuestionBlueprints, ({one, many}) => ({
	feedbackBlueprint: one(feedbackBlueprints, {
		fields: [feedbackQuestionBlueprints.feedbackBlueprintId],
		references: [feedbackBlueprints.id]
	}),
	feedbackQuestions: many(feedbackQuestions),
}));

export const feedbackQuestionsRelations = relations(feedbackQuestions, ({one, many}) => ({
	feedback: one(feedback, {
		fields: [feedbackQuestions.feedbackId],
		references: [feedback.id]
	}),
	feedbackQuestionBlueprint: one(feedbackQuestionBlueprints, {
		fields: [feedbackQuestions.feedbackQuestionBlueprintId],
		references: [feedbackQuestionBlueprints.id]
	}),
	feedbackResponses: many(feedbackResponses),
}));

export const feedbackResponsesRelations = relations(feedbackResponses, ({one}) => ({
	feedback: one(feedback, {
		fields: [feedbackResponses.feedbackId],
		references: [feedback.id]
	}),
	feedbackQuestion: one(feedbackQuestions, {
		fields: [feedbackResponses.feedbackQuestionId],
		references: [feedbackQuestions.id]
	}),
	user: one(users, {
		fields: [feedbackResponses.userId],
		references: [users.id]
	}),
}));

export const flagQueryRelations = relations(flagQuery, ({one}) => ({
	flag: one(flags, {
		fields: [flagQuery.flagId],
		references: [flags.id]
	}),
	query: one(queries, {
		fields: [flagQuery.queryId],
		references: [queries.id]
	}),
}));

export const flagsRelations = relations(flags, ({one, many}) => ({
	flagQueries: many(flagQuery),
	batch: one(batches, {
		fields: [flags.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [flags.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [flags.userId],
		references: [users.id]
	}),
}));

export const queriesRelations = relations(queries, ({one, many}) => ({
	flagQueries: many(flagQuery),
	batch: one(batches, {
		fields: [queries.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [queries.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [queries.userId],
		references: [users.id]
	}),
	queryComments: many(queryComments),
}));

export const githubsRelations = relations(githubs, ({one}) => ({
	user: one(users, {
		fields: [githubs.userId],
		references: [users.id]
	}),
}));

export const guardianRelations = relations(guardian, ({one, many}) => ({
	user: one(users, {
		fields: [guardian.guardianId],
		references: [users.id]
	}),
	userGuardians: many(userGuardian),
}));

export const helpFaqsRelations = relations(helpFaqs, ({one}) => ({
	batch: one(batches, {
		fields: [helpFaqs.batchId],
		references: [batches.id]
	}),
}));

export const instituteBatchesRelations = relations(instituteBatches, ({one}) => ({
	batch: one(batches, {
		fields: [instituteBatches.batchId],
		references: [batches.id]
	}),
	institute: one(institutes, {
		fields: [instituteBatches.instituteId],
		references: [institutes.id]
	}),
}));

export const institutesRelations = relations(institutes, ({many}) => ({
	instituteBatches: many(instituteBatches),
}));

export const interactionMessagesRelations = relations(interactionMessages, ({one}) => ({
	interaction: one(interactions, {
		fields: [interactionMessages.interactionId],
		references: [interactions.id]
	}),
	user: one(users, {
		fields: [interactionMessages.userId],
		references: [users.id]
	}),
}));

export const interactionsRelations = relations(interactions, ({one, many}) => ({
	interactionMessages: many(interactionMessages),
	ticket: one(tickets, {
		fields: [interactions.ticketId],
		references: [tickets.id]
	}),
	user: one(users, {
		fields: [interactions.userId],
		references: [users.id]
	}),
}));

export const interviewsRelations = relations(interviews, ({one}) => ({
	application: one(applications, {
		fields: [interviews.applicationId],
		references: [applications.id]
	}),
	user_createdBy: one(users, {
		fields: [interviews.createdBy],
		references: [users.id],
		relationName: "interviews_createdBy_users_id"
	}),
	user_userId: one(users, {
		fields: [interviews.userId],
		references: [users.id],
		relationName: "interviews_userId_users_id"
	}),
}));

export const learningObjectivesRelations = relations(learningObjectives, ({one}) => ({
	topicObjective: one(topicObjectives, {
		fields: [learningObjectives.topicId],
		references: [topicObjectives.id]
	}),
}));

export const topicObjectivesRelations = relations(topicObjectives, ({one, many}) => ({
	learningObjectives: many(learningObjectives),
	menu: one(menus, {
		fields: [topicObjectives.topicGroup],
		references: [menus.id]
	}),
}));

export const lectureAiGeneratedContentRelations = relations(lectureAiGeneratedContent, ({one}) => ({
	lecture: one(lectures, {
		fields: [lectureAiGeneratedContent.lectureId],
		references: [lectures.id]
	}),
}));

export const lectureBlueprintsRelations = relations(lectureBlueprints, ({one}) => ({
	blueprint: one(blueprints, {
		fields: [lectureBlueprints.blueprintId],
		references: [blueprints.id]
	}),
	lecture: one(lectures, {
		fields: [lectureBlueprints.lectureId],
		references: [lectures.id]
	}),
	sectionFeedbackBlueprint: one(sectionFeedbackBlueprints, {
		fields: [lectureBlueprints.sectionFeedbackBlueprintId],
		references: [sectionFeedbackBlueprints.id]
	}),
	user: one(users, {
		fields: [lectureBlueprints.userId],
		references: [users.id]
	}),
}));

export const sectionFeedbackBlueprintsRelations = relations(sectionFeedbackBlueprints, ({one, many}) => ({
	lectureBlueprints: many(lectureBlueprints),
	blueprint: one(blueprints, {
		fields: [sectionFeedbackBlueprints.blueprintId],
		references: [blueprints.id]
	}),
	feedbackBlueprint: one(feedbackBlueprints, {
		fields: [sectionFeedbackBlueprints.feedbackBlueprintId],
		references: [feedbackBlueprints.id]
	}),
	feedback: one(feedback, {
		fields: [sectionFeedbackBlueprints.feedbackId],
		references: [feedback.id]
	}),
	quiz: one(quizzes, {
		fields: [sectionFeedbackBlueprints.quizId],
		references: [quizzes.id]
	}),
}));

export const lectureFeedbackRelations = relations(lectureFeedback, ({one}) => ({
	user: one(users, {
		fields: [lectureFeedback.userId],
		references: [users.id]
	}),
	lecture: one(lectures, {
		fields: [lectureFeedback.lectureId],
		references: [lectures.id]
	}),
}));

export const lectureInteractionsRelations = relations(lectureInteractions, ({one}) => ({
	lecture: one(lectures, {
		fields: [lectureInteractions.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [lectureInteractions.userId],
		references: [users.id]
	}),
}));

export const lectureParticipantsRelations = relations(lectureParticipants, ({one}) => ({
	externalEmployee: one(externalEmployees, {
		fields: [lectureParticipants.eeId],
		references: [externalEmployees.id]
	}),
	lecture: one(lectures, {
		fields: [lectureParticipants.lectureId],
		references: [lectures.id]
	}),
	user: one(users, {
		fields: [lectureParticipants.userId],
		references: [users.id]
	}),
}));

export const lecturesAiRelations = relations(lecturesAi, ({one}) => ({
	lecture: one(lectures, {
		fields: [lecturesAi.lectureId],
		references: [lectures.id]
	}),
}));

export const masaiverseBannersRelations = relations(masaiverseBanners, ({one}) => ({
	user_createdBy: one(users, {
		fields: [masaiverseBanners.createdBy],
		references: [users.id],
		relationName: "masaiverseBanners_createdBy_users_id"
	}),
	user_lastEditedBy: one(users, {
		fields: [masaiverseBanners.lastEditedBy],
		references: [users.id],
		relationName: "masaiverseBanners_lastEditedBy_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	user_authorId: one(users, {
		fields: [messages.authorId],
		references: [users.id],
		relationName: "messages_authorId_users_id"
	}),
	message: one(messages, {
		fields: [messages.messageId],
		references: [messages.id],
		relationName: "messages_messageId_messages_id"
	}),
	messages: many(messages, {
		relationName: "messages_messageId_messages_id"
	}),
	user_userId: one(users, {
		fields: [messages.userId],
		references: [users.id],
		relationName: "messages_userId_users_id"
	}),
}));

export const notesRelations = relations(notes, ({one}) => ({
	user: one(users, {
		fields: [notes.authorId],
		references: [users.id]
	}),
}));

export const notificationLogsRelations = relations(notificationLogs, ({one}) => ({
	user: one(users, {
		fields: [notificationLogs.userId],
		references: [users.id]
	}),
}));

export const npsFormsRelations = relations(npsForms, ({one, many}) => ({
	batch: one(batches, {
		fields: [npsForms.batchId],
		references: [batches.id]
	}),
	section: one(sections, {
		fields: [npsForms.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [npsForms.userId],
		references: [users.id]
	}),
	npsQuestions: many(npsQuestions),
	npsSubmissions: many(npsSubmissions),
}));

export const npsQuestionResponsesRelations = relations(npsQuestionResponses, ({one}) => ({
	npsQuestion: one(npsQuestions, {
		fields: [npsQuestionResponses.npsQuestionId],
		references: [npsQuestions.id]
	}),
	npsSubmission: one(npsSubmissions, {
		fields: [npsQuestionResponses.npsSubmissionId],
		references: [npsSubmissions.id]
	}),
}));

export const npsQuestionsRelations = relations(npsQuestions, ({one, many}) => ({
	npsQuestionResponses: many(npsQuestionResponses),
	npsForm: one(npsForms, {
		fields: [npsQuestions.npsFormId],
		references: [npsForms.id]
	}),
}));

export const npsSubmissionsRelations = relations(npsSubmissions, ({one, many}) => ({
	npsQuestionResponses: many(npsQuestionResponses),
	npsForm: one(npsForms, {
		fields: [npsSubmissions.npsFormId],
		references: [npsForms.id]
	}),
	user: one(users, {
		fields: [npsSubmissions.userId],
		references: [users.id]
	}),
}));

export const optInChoicesRelations = relations(optInChoices, ({one, many}) => ({
	section: one(sections, {
		fields: [optInChoices.sectionId],
		references: [sections.id]
	}),
	sectionUsers: many(sectionUser),
	unitMovementRules: many(unitMovementRules),
}));

export const participantMetricsRelations = relations(participantMetrics, ({one}) => ({
	meeting: one(meetings, {
		fields: [participantMetrics.lectureId],
		references: [meetings.lectureId]
	}),
}));

export const participantsRelations = relations(participants, ({one}) => ({
	meeting: one(meetings, {
		fields: [participants.lectureId],
		references: [meetings.lectureId]
	}),
}));

export const placementStatusesRelations = relations(placementStatuses, ({one}) => ({
	user: one(users, {
		fields: [placementStatuses.userId],
		references: [users.id]
	}),
}));

export const placementTagsRelations = relations(placementTags, ({one}) => ({
	user: one(users, {
		fields: [placementTags.userId],
		references: [users.id]
	}),
}));

export const portfolioFeedbackRelations = relations(portfolioFeedback, ({one}) => ({
	portfolioSubmission: one(portfolioSubmissions, {
		fields: [portfolioFeedback.submissionId],
		references: [portfolioSubmissions.id]
	}),
	user: one(users, {
		fields: [portfolioFeedback.userId],
		references: [users.id]
	}),
}));

export const portfolioSubmissionsRelations = relations(portfolioSubmissions, ({one, many}) => ({
	portfolioFeedbacks: many(portfolioFeedback),
	user: one(users, {
		fields: [portfolioSubmissions.studentId],
		references: [users.id]
	}),
}));

export const portfolioStudentIasRelations = relations(portfolioStudentIas, ({one}) => ({
	user_iaId: one(users, {
		fields: [portfolioStudentIas.iaId],
		references: [users.id],
		relationName: "portfolioStudentIas_iaId_users_id"
	}),
	user_studentId: one(users, {
		fields: [portfolioStudentIas.studentId],
		references: [users.id],
		relationName: "portfolioStudentIas_studentId_users_id"
	}),
}));

export const positionParamsRelations = relations(positionParams, ({one}) => ({
	position: one(positions, {
		fields: [positionParams.positionId],
		references: [positions.id]
	}),
}));

export const eligibilitiesRelations = relations(eligibilities, ({many}) => ({
	positions: many(positions),
}));

export const positionsHistoriesRelations = relations(positionsHistories, ({one}) => ({
	position: one(positions, {
		fields: [positionsHistories.positionId],
		references: [positions.id]
	}),
	user: one(users, {
		fields: [positionsHistories.userId],
		references: [users.id]
	}),
}));

export const practiceInterviewsRelations = relations(practiceInterviews, ({one}) => ({
	user: one(users, {
		fields: [practiceInterviews.userId],
		references: [users.id]
	}),
}));

export const practiceQuizResponsesRelations = relations(practiceQuizResponses, ({one}) => ({
	user: one(users, {
		fields: [practiceQuizResponses.userId],
		references: [users.id]
	}),
}));

export const practiceTestQuestionsRelations = relations(practiceTestQuestions, ({one, many}) => ({
	practiceTestSubTopic: one(practiceTestSubTopics, {
		fields: [practiceTestQuestions.practiceSubTopicId],
		references: [practiceTestSubTopics.id]
	}),
	practiceTestQuestionsUsersAttempteds: many(practiceTestQuestionsUsersAttempted),
}));

export const practiceTestSubTopicsRelations = relations(practiceTestSubTopics, ({one, many}) => ({
	practiceTestQuestions: many(practiceTestQuestions),
	practiceTestTopic: one(practiceTestTopics, {
		fields: [practiceTestSubTopics.practiceTopicId],
		references: [practiceTestTopics.id]
	}),
}));

export const practiceTestQuestionsUsersAttemptedRelations = relations(practiceTestQuestionsUsersAttempted, ({one}) => ({
	practiceTestQuestion: one(practiceTestQuestions, {
		fields: [practiceTestQuestionsUsersAttempted.practiceTestQuestionId],
		references: [practiceTestQuestions.id]
	}),
	user: one(users, {
		fields: [practiceTestQuestionsUsersAttempted.userId],
		references: [users.id]
	}),
}));

export const practiceTestTopicsRelations = relations(practiceTestTopics, ({many}) => ({
	practiceTestSubTopics: many(practiceTestSubTopics),
}));

export const problemLinksRelations = relations(problemLinks, ({one}) => ({
	assignment: one(assignments, {
		fields: [problemLinks.assignmentId],
		references: [assignments.id]
	}),
	problem: one(problems, {
		fields: [problemLinks.problemId],
		references: [problems.id]
	}),
}));

export const profileVerifiesRelations = relations(profileVerifies, ({one}) => ({
	user_createdBy: one(users, {
		fields: [profileVerifies.createdBy],
		references: [users.id],
		relationName: "profileVerifies_createdBy_users_id"
	}),
	user_rejectedBy: one(users, {
		fields: [profileVerifies.rejectedBy],
		references: [users.id],
		relationName: "profileVerifies_rejectedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [profileVerifies.userId],
		references: [users.id],
		relationName: "profileVerifies_userId_users_id"
	}),
	user_verifiedBy: one(users, {
		fields: [profileVerifies.verifiedBy],
		references: [users.id],
		relationName: "profileVerifies_verifiedBy_users_id"
	}),
}));

export const profilesRelations = relations(profiles, ({one}) => ({
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
}));

export const queryCommentsRelations = relations(queryComments, ({one}) => ({
	query: one(queries, {
		fields: [queryComments.queryId],
		references: [queries.id]
	}),
	user: one(users, {
		fields: [queryComments.userId],
		references: [users.id]
	}),
}));

export const questionQuizRelations = relations(questionQuiz, ({one}) => ({
	question: one(questions, {
		fields: [questionQuiz.questionId],
		references: [questions.id]
	}),
	quiz: one(quizzes, {
		fields: [questionQuiz.quizId],
		references: [quizzes.id]
	}),
}));

export const quizBlueprintsRelations = relations(quizBlueprints, ({one, many}) => ({
	blueprint: one(blueprints, {
		fields: [quizBlueprints.blueprintId],
		references: [blueprints.id]
	}),
	quiz: one(quizzes, {
		fields: [quizBlueprints.quizId],
		references: [quizzes.id]
	}),
	user: one(users, {
		fields: [quizBlueprints.userId],
		references: [users.id]
	}),
	quizBlueprintsQuestions: many(quizBlueprintsQuestions),
}));

export const quizBlueprintsQuestionsRelations = relations(quizBlueprintsQuestions, ({one}) => ({
	question: one(questions, {
		fields: [quizBlueprintsQuestions.questionId],
		references: [questions.id]
	}),
	quizBlueprint: one(quizBlueprints, {
		fields: [quizBlueprintsQuestions.quizBlueprintId],
		references: [quizBlueprints.id]
	}),
}));

export const rbacRolePermissionsRelations = relations(rbacRolePermissions, ({one}) => ({
	rbacPermission: one(rbacPermissions, {
		fields: [rbacRolePermissions.permissionId],
		references: [rbacPermissions.id]
	}),
	rbacRole: one(rbacRoles, {
		fields: [rbacRolePermissions.roleId],
		references: [rbacRoles.id]
	}),
}));

export const rbacPermissionsRelations = relations(rbacPermissions, ({many}) => ({
	rbacRolePermissions: many(rbacRolePermissions),
}));

export const rbacRolesRelations = relations(rbacRoles, ({one, many}) => ({
	rbacRolePermissions: many(rbacRolePermissions),
	user: one(users, {
		fields: [rbacRoles.createdBy],
		references: [users.id]
	}),
	rbacUserRoles: many(rbacUserRoles),
}));

export const rbacUserRolesRelations = relations(rbacUserRoles, ({one}) => ({
	user_assignedBy: one(users, {
		fields: [rbacUserRoles.assignedBy],
		references: [users.id],
		relationName: "rbacUserRoles_assignedBy_users_id"
	}),
	batch: one(batches, {
		fields: [rbacUserRoles.batchId],
		references: [batches.id]
	}),
	rbacRole: one(rbacRoles, {
		fields: [rbacUserRoles.roleId],
		references: [rbacRoles.id]
	}),
	section: one(sections, {
		fields: [rbacUserRoles.sectionId],
		references: [sections.id]
	}),
	user_userId: one(users, {
		fields: [rbacUserRoles.userId],
		references: [users.id],
		relationName: "rbacUserRoles_userId_users_id"
	}),
}));

export const repliesRelations = relations(replies, ({one, many}) => ({
	post: one(posts, {
		fields: [replies.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [replies.userId],
		references: [users.id]
	}),
	votes: many(votes),
}));

export const scenesRelations = relations(scenes, ({one, many}) => ({
	lecture: one(lectures, {
		fields: [scenes.lectureId],
		references: [lectures.id]
	}),
	segments: many(segments),
	userScenes: many(userScenes),
}));

export const sectionUserRelations = relations(sectionUser, ({one}) => ({
	user_managerId: one(users, {
		fields: [sectionUser.managerId],
		references: [users.id],
		relationName: "sectionUser_managerId_users_id"
	}),
	optInChoice: one(optInChoices, {
		fields: [sectionUser.optInChoiceId],
		references: [optInChoices.id]
	}),
	section: one(sections, {
		fields: [sectionUser.sectionId],
		references: [sections.id]
	}),
	user_userId: one(users, {
		fields: [sectionUser.userId],
		references: [users.id],
		relationName: "sectionUser_userId_users_id"
	}),
}));

export const segmentsRelations = relations(segments, ({one, many}) => ({
	scene: one(scenes, {
		fields: [segments.sceneId],
		references: [scenes.id]
	}),
	userSegments: many(userSegments),
}));

export const solutionsRelations = relations(solutions, ({one}) => ({
	problem: one(problems, {
		fields: [solutions.problemId],
		references: [problems.id]
	}),
	submission: one(submissions, {
		fields: [solutions.submissionId],
		references: [submissions.id]
	}),
}));

export const submissionsRelations = relations(submissions, ({one, many}) => ({
	solutions: many(solutions),
	assignment: one(assignments, {
		fields: [submissions.assignmentId],
		references: [assignments.id]
	}),
	user: one(users, {
		fields: [submissions.userId],
		references: [users.id]
	}),
}));

export const studentAttendancesRelations = relations(studentAttendances, ({one}) => ({
	batch: one(batches, {
		fields: [studentAttendances.batchId],
		references: [batches.id]
	}),
	lecture: one(lectures, {
		fields: [studentAttendances.lectureId],
		references: [lectures.id]
	}),
	section: one(sections, {
		fields: [studentAttendances.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [studentAttendances.userId],
		references: [users.id]
	}),
}));

export const studentTagCategoriesRelations = relations(studentTagCategories, ({one, many}) => ({
	studentTagCategory: one(studentTagCategories, {
		fields: [studentTagCategories.parentCategoryId],
		references: [studentTagCategories.id],
		relationName: "studentTagCategories_parentCategoryId_studentTagCategories_id"
	}),
	studentTagCategories: many(studentTagCategories, {
		relationName: "studentTagCategories_parentCategoryId_studentTagCategories_id"
	}),
	studentTagRelations: many(studentTagRelation),
}));

export const studentTagRelationRelations = relations(studentTagRelation, ({one, many}) => ({
	studentTagCategory: one(studentTagCategories, {
		fields: [studentTagRelation.categoryId],
		references: [studentTagCategories.id]
	}),
	studentTagName: one(studentTagNames, {
		fields: [studentTagRelation.nameId],
		references: [studentTagNames.id]
	}),
	studentTagType: one(studentTagTypes, {
		fields: [studentTagRelation.typeId],
		references: [studentTagTypes.id]
	}),
	user: one(users, {
		fields: [studentTagRelation.userId],
		references: [users.id]
	}),
	userRelations: many(userRelation),
}));

export const studentTagNamesRelations = relations(studentTagNames, ({many}) => ({
	studentTagRelations: many(studentTagRelation),
}));

export const studentTagTypesRelations = relations(studentTagTypes, ({many}) => ({
	studentTagRelations: many(studentTagRelation),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	user: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id]
	}),
	batch: one(batches, {
		fields: [tasks.batchId],
		references: [batches.id]
	}),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({one}) => ({
	team: one(teams, {
		fields: [teamInvitations.teamId],
		references: [teams.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	teamInvitations: many(teamInvitations),
}));

export const threadsRelations = relations(threads, ({one}) => ({
	discussion: one(discussions, {
		fields: [threads.discussionId],
		references: [discussions.id]
	}),
	user: one(users, {
		fields: [threads.userId],
		references: [users.id]
	}),
}));

export const ticketTemplatesRelations = relations(ticketTemplates, ({one}) => ({
	user_createdBy: one(users, {
		fields: [ticketTemplates.createdBy],
		references: [users.id],
		relationName: "ticketTemplates_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [ticketTemplates.updatedBy],
		references: [users.id],
		relationName: "ticketTemplates_updatedBy_users_id"
	}),
}));

export const menusRelations = relations(menus, ({many}) => ({
	topicObjectives: many(topicObjectives),
}));

export const unitMovementUserDetailsRelations = relations(unitMovementUserDetails, ({one}) => ({
	section: one(sections, {
		fields: [unitMovementUserDetails.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [unitMovementUserDetails.userId],
		references: [users.id]
	}),
}));

export const userBadgesRelations = relations(userBadges, ({one}) => ({
	badgeConfig: one(badgeConfigs, {
		fields: [userBadges.badgeConfigId],
		references: [badgeConfigs.id]
	}),
	badge: one(badges, {
		fields: [userBadges.badgeId],
		references: [badges.id]
	}),
	user_createdBy: one(users, {
		fields: [userBadges.createdBy],
		references: [users.id],
		relationName: "userBadges_createdBy_users_id"
	}),
	user_userId: one(users, {
		fields: [userBadges.userId],
		references: [users.id],
		relationName: "userBadges_userId_users_id"
	}),
}));

export const userBatchAdmissionDataRelations = relations(userBatchAdmissionData, ({one}) => ({
	batch: one(batches, {
		fields: [userBatchAdmissionData.batchId],
		references: [batches.id]
	}),
	user: one(users, {
		fields: [userBatchAdmissionData.userId],
		references: [users.id]
	}),
}));

export const userBlockEmailsRelations = relations(userBlockEmails, ({one}) => ({
	block: one(blocks, {
		fields: [userBlockEmails.blockId],
		references: [blocks.id]
	}),
	blockUnitMovementEmail: one(blockUnitMovementEmails, {
		fields: [userBlockEmails.blockUnitMovementEmailId],
		references: [blockUnitMovementEmails.id]
	}),
	user: one(users, {
		fields: [userBlockEmails.userId],
		references: [users.id]
	}),
}));

export const userCallbackTicketsRelations = relations(userCallbackTickets, ({one}) => ({
	user_assignedTo: one(users, {
		fields: [userCallbackTickets.assignedTo],
		references: [users.id],
		relationName: "userCallbackTickets_assignedTo_users_id"
	}),
	batch: one(batches, {
		fields: [userCallbackTickets.batchId],
		references: [batches.id]
	}),
	user_resolvedBy: one(users, {
		fields: [userCallbackTickets.resolvedBy],
		references: [users.id],
		relationName: "userCallbackTickets_resolvedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [userCallbackTickets.userId],
		references: [users.id],
		relationName: "userCallbackTickets_userId_users_id"
	}),
}));

export const userCertificatesRelations = relations(userCertificates, ({one}) => ({
	batch: one(batches, {
		fields: [userCertificates.batchId],
		references: [batches.id]
	}),
	user: one(users, {
		fields: [userCertificates.userId],
		references: [users.id]
	}),
}));

export const userDeviceTokensRelations = relations(userDeviceTokens, ({one}) => ({
	user: one(users, {
		fields: [userDeviceTokens.userId],
		references: [users.id]
	}),
}));

export const userDocumentsRelations = relations(userDocuments, ({one}) => ({
	user: one(users, {
		fields: [userDocuments.userId],
		references: [users.id]
	}),
}));

export const userGuardianRelations = relations(userGuardian, ({one}) => ({
	guardian: one(guardian, {
		fields: [userGuardian.guardianId],
		references: [guardian.guardianId]
	}),
	user: one(users, {
		fields: [userGuardian.userId],
		references: [users.id]
	}),
}));

export const userRelationRelations = relations(userRelation, ({one, many}) => ({
	studentTagRelation: one(studentTagRelation, {
		fields: [userRelation.relationId],
		references: [studentTagRelation.id]
	}),
	section: one(sections, {
		fields: [userRelation.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [userRelation.userId],
		references: [users.id]
	}),
	userRelationHistories: many(userRelationHistory),
}));

export const userRelationHistoryRelations = relations(userRelationHistory, ({one}) => ({
	user: one(users, {
		fields: [userRelationHistory.userId],
		references: [users.id]
	}),
	userRelation: one(userRelation, {
		fields: [userRelationHistory.userRelationId],
		references: [userRelation.id]
	}),
}));

export const userScenesRelations = relations(userScenes, ({one}) => ({
	scene: one(scenes, {
		fields: [userScenes.sceneId],
		references: [scenes.id]
	}),
	user: one(users, {
		fields: [userScenes.userId],
		references: [users.id]
	}),
}));

export const userSegmentsRelations = relations(userSegments, ({one}) => ({
	segment: one(segments, {
		fields: [userSegments.segmentId],
		references: [segments.id]
	}),
	user: one(users, {
		fields: [userSegments.userId],
		references: [users.id]
	}),
}));

export const videoAttendancesRelations = relations(videoAttendances, ({one}) => ({
	user_hostId: one(users, {
		fields: [videoAttendances.hostId],
		references: [users.id],
		relationName: "videoAttendances_hostId_users_id"
	}),
	lecture: one(lectures, {
		fields: [videoAttendances.lectureId],
		references: [lectures.id]
	}),
	user_userId: one(users, {
		fields: [videoAttendances.userId],
		references: [users.id],
		relationName: "videoAttendances_userId_users_id"
	}),
}));

export const votesRelations = relations(votes, ({one}) => ({
	post: one(posts, {
		fields: [votes.postId],
		references: [posts.id]
	}),
	reply: one(replies, {
		fields: [votes.replyId],
		references: [replies.id]
	}),
	user: one(users, {
		fields: [votes.userId],
		references: [users.id]
	}),
}));