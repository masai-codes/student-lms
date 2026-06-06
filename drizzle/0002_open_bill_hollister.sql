CREATE TABLE `club_members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`club_id` bigint unsigned NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'member',
	`joined_at` timestamp NOT NULL DEFAULT (now()),
	`meta` json,
	CONSTRAINT `club_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `club_members_user_id_club_id_unique` UNIQUE(`user_id`,`club_id`)
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`image` text,
	`meta` json,
	`created_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_enrollments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`event_id` bigint unsigned NOT NULL,
	`enrolled_at` timestamp NOT NULL DEFAULT (now()),
	`meta` json,
	CONSTRAINT `event_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_enrollments_user_id_event_id_unique` UNIQUE(`user_id`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`club_id` bigint unsigned,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('hackathon','meetup','webinar'),
	`mode` enum('online','offline'),
	`location_title` varchar(255),
	`location_map_link` text,
	`event_link` text,
	`image_link` text,
	`platform` varchar(50),
	`start_time` timestamp,
	`end_time` timestamp,
	`meta` json,
	`created_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masaiverse_leaderboard` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_by` bigint unsigned,
	`reason` varchar(50) NOT NULL,
	`points` int NOT NULL,
	`post_id` bigint unsigned,
	`reply_id` bigint unsigned,
	`event_id` bigint unsigned,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `masaiverse_leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`otp_hash` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`used_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `otp_codes_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`club_id` bigint unsigned,
	`user_id` bigint unsigned NOT NULL,
	`title` text,
	`content` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	`banned_by` bigint unsigned,
	`banned_date` timestamp,
	`is_banned` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`post_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`content` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`post_id` bigint unsigned,
	`reply_id` bigint unsigned,
	`vote` enum('upvote','downvote') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lectures_ai` RENAME COLUMN `transcriptID` TO `transcriptId`;--> statement-breakpoint
ALTER TABLE `portfolio_feedback` RENAME COLUMN `videoURL` TO `videoUrl`;--> statement-breakpoint
ALTER TABLE `portfolio_submissions` RENAME COLUMN `submissionURL` TO `submissionUrl`;--> statement-breakpoint
ALTER TABLE `access_logs` DROP FOREIGN KEY `access_logs_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_approvers` DROP FOREIGN KEY `adhoc_session_approvers_adhoc_session_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_approvers` DROP FOREIGN KEY `adhoc_session_approvers_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_batches` DROP FOREIGN KEY `adhoc_session_batches_adhoc_session_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_batches` DROP FOREIGN KEY `adhoc_session_batches_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_blocks` DROP FOREIGN KEY `adhoc_session_blocks_adhoc_session_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_blocks` DROP FOREIGN KEY `adhoc_session_blocks_block_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_sections` DROP FOREIGN KEY `adhoc_session_sections_adhoc_session_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_sections` DROP FOREIGN KEY `adhoc_session_sections_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_users` DROP FOREIGN KEY `adhoc_session_users_adhoc_session_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_users` DROP FOREIGN KEY `adhoc_session_users_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_sessions` DROP FOREIGN KEY `adhoc_sessions_adhoc_session_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_sessions` DROP FOREIGN KEY `adhoc_sessions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` DROP FOREIGN KEY `ai_chat_practice_questions_lectureId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` DROP FOREIGN KEY `ai_chat_practice_questions_userId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_feedback` DROP FOREIGN KEY `ai_feedback_lectureId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_feedback` DROP FOREIGN KEY `ai_feedback_userId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_practice_questions` DROP FOREIGN KEY `ai_practice_questions_lectureId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_practice_questions` DROP FOREIGN KEY `ai_practice_questions_userId_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` DROP FOREIGN KEY `ai_tutor_sessions_lecture_id_fkey`;
--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` DROP FOREIGN KEY `ai_tutor_sessions_user_id_fkey`;
--> statement-breakpoint
ALTER TABLE `announcements` DROP FOREIGN KEY `announcements_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `announcements` DROP FOREIGN KEY `announcements_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `announcements` DROP FOREIGN KEY `announcements_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `answers` DROP FOREIGN KEY `answers_attempt_id_foreign`;
--> statement-breakpoint
ALTER TABLE `answers` DROP FOREIGN KEY `answers_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `application_comments` DROP FOREIGN KEY `application_comments_application_id_foreign`;
--> statement-breakpoint
ALTER TABLE `application_comments` DROP FOREIGN KEY `application_comments_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `application_histories` DROP FOREIGN KEY `application_histories_application_id_foreign`;
--> statement-breakpoint
ALTER TABLE `application_histories` DROP FOREIGN KEY `application_histories_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `applications` DROP FOREIGN KEY `applications_position_id_foreign`;
--> statement-breakpoint
ALTER TABLE `applications` DROP FOREIGN KEY `applications_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_blueprints` DROP FOREIGN KEY `assignment_blueprints_assignment_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_blueprints` DROP FOREIGN KEY `assignment_blueprints_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_blueprints` DROP FOREIGN KEY `assignment_blueprints_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_blueprints_problems` DROP FOREIGN KEY `assignment_blueprints_problems_assignment_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_blueprints_problems` DROP FOREIGN KEY `assignment_blueprints_problems_problem_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_problem` DROP FOREIGN KEY `assignment_problem_assignment_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignment_problem` DROP FOREIGN KEY `assignment_problem_problem_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignments` DROP FOREIGN KEY `assignments_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignments` DROP FOREIGN KEY `assignments_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `assignments` DROP FOREIGN KEY `assignments_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attempts` DROP FOREIGN KEY `attempts_quiz_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attempts` DROP FOREIGN KEY `attempts_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_host_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `attendances` DROP FOREIGN KEY `attendances_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info` DROP FOREIGN KEY `batch_info_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info` DROP FOREIGN KEY `batch_info_checker_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info` DROP FOREIGN KEY `batch_info_maker_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info_history` DROP FOREIGN KEY `batch_info_history_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info_history` DROP FOREIGN KEY `batch_info_history_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_info_template_items` DROP FOREIGN KEY `batch_info_template_items_batch_info_template_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_participants` DROP FOREIGN KEY `batch_participants_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_user` DROP FOREIGN KEY `batch_user_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `batch_user` DROP FOREIGN KEY `batch_user_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` DROP FOREIGN KEY `block_draft_unit_movements_block_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` DROP FOREIGN KEY `block_draft_unit_movements_draft_unit_movement_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` DROP FOREIGN KEY `block_draft_unit_movements_new_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` DROP FOREIGN KEY `block_draft_unit_movements_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` DROP FOREIGN KEY `block_draft_unit_movements_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `block_unit_movement_emails` DROP FOREIGN KEY `block_unit_movement_emails_block_id_foreign`;
--> statement-breakpoint
ALTER TABLE `blueprints` DROP FOREIGN KEY `blueprints_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `blueprints` DROP FOREIGN KEY `blueprints_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `bookmarks` DROP FOREIGN KEY `bookmarks_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `certificates` DROP FOREIGN KEY `certificates_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `comments` DROP FOREIGN KEY `comments_ticket_id_foreign`;
--> statement-breakpoint
ALTER TABLE `comments` DROP FOREIGN KEY `comments_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `disbursal_statuses` DROP FOREIGN KEY `disbursal_statuses_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `discussions` DROP FOREIGN KEY `discussions_assignee_id_foreign`;
--> statement-breakpoint
ALTER TABLE `discussions` DROP FOREIGN KEY `discussions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `draft_unit_movements` DROP FOREIGN KEY `draft_unit_movements_new_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `draft_unit_movements` DROP FOREIGN KEY `draft_unit_movements_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `draft_unit_movements` DROP FOREIGN KEY `draft_unit_movements_unit_movement_rule_id_foreign`;
--> statement-breakpoint
ALTER TABLE `draft_unit_movements` DROP FOREIGN KEY `draft_unit_movements_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_entity` DROP FOREIGN KEY `elective_entity_elective_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_progress` DROP FOREIGN KEY `elective_progress_elective_entity_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_progress` DROP FOREIGN KEY `elective_progress_elective_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_section` DROP FOREIGN KEY `elective_section_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_section` DROP FOREIGN KEY `elective_section_elective_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_section` DROP FOREIGN KEY `elective_section_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_user` DROP FOREIGN KEY `elective_user_elective_id_foreign`;
--> statement-breakpoint
ALTER TABLE `elective_user` DROP FOREIGN KEY `elective_user_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `electives` DROP FOREIGN KEY `electives_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `external_offers` DROP FOREIGN KEY `external_offers_company_id_foreign`;
--> statement-breakpoint
ALTER TABLE `external_offers` DROP FOREIGN KEY `external_offers_lead_id_foreign`;
--> statement-breakpoint
ALTER TABLE `external_offers` DROP FOREIGN KEY `external_offers_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback` DROP FOREIGN KEY `feedback_feedback_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback` DROP FOREIGN KEY `feedback_quiz_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_question_blueprints` DROP FOREIGN KEY `feedback_question_blueprints_feedback_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_questions` DROP FOREIGN KEY `feedback_questions_feedback_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_questions` DROP FOREIGN KEY `feedback_questions_feedback_question_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_responses` DROP FOREIGN KEY `feedback_responses_feedback_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_responses` DROP FOREIGN KEY `feedback_responses_feedback_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `feedback_responses` DROP FOREIGN KEY `feedback_responses_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `flag_query` DROP FOREIGN KEY `flag_query_flag_id_foreign`;
--> statement-breakpoint
ALTER TABLE `flag_query` DROP FOREIGN KEY `flag_query_query_id_foreign`;
--> statement-breakpoint
ALTER TABLE `flags` DROP FOREIGN KEY `flags_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `flags` DROP FOREIGN KEY `flags_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `flags` DROP FOREIGN KEY `flags_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `githubs` DROP FOREIGN KEY `githubs_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `guardian` DROP FOREIGN KEY `guardian_guardian_id_foreign`;
--> statement-breakpoint
ALTER TABLE `help_faqs` DROP FOREIGN KEY `help_faqs_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `institute_batches` DROP FOREIGN KEY `institute_batches_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `institute_batches` DROP FOREIGN KEY `institute_batches_institute_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interaction_messages` DROP FOREIGN KEY `interaction_message_interaction_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interaction_messages` DROP FOREIGN KEY `interaction_message_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interactions` DROP FOREIGN KEY `interaction_ticket_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interactions` DROP FOREIGN KEY `interaction_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interviews` DROP FOREIGN KEY `interviews_application_id_foreign`;
--> statement-breakpoint
ALTER TABLE `interviews` DROP FOREIGN KEY `interviews_created_by_foreign`;
--> statement-breakpoint
ALTER TABLE `interviews` DROP FOREIGN KEY `interviews_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `leads` DROP FOREIGN KEY `leads_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `learning_objectives` DROP FOREIGN KEY `learning_objectives_topic_id_index`;
--> statement-breakpoint
ALTER TABLE `lecture_ai_generated_content` DROP FOREIGN KEY `lecture_ai_generated_content_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_blueprints` DROP FOREIGN KEY `lecture_blueprints_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_blueprints` DROP FOREIGN KEY `lecture_blueprints_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_blueprints` DROP FOREIGN KEY `lecture_blueprints_section_feedback_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_blueprints` DROP FOREIGN KEY `lecture_blueprints_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_feedback` DROP FOREIGN KEY `lecture_feedback_user_id_fkey`;
--> statement-breakpoint
ALTER TABLE `lecture_feedback` DROP FOREIGN KEY `lecture_feedback_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_interactions` DROP FOREIGN KEY `lecture_interactions_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lecture_interactions` DROP FOREIGN KEY `lecture_interactions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures` DROP FOREIGN KEY `lectures_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures` DROP FOREIGN KEY `lectures_feedback_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures` DROP FOREIGN KEY `lectures_host_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures` DROP FOREIGN KEY `lectures_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures` DROP FOREIGN KEY `lectures_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `lectures_ai` DROP FOREIGN KEY `lectures_ai_lectureId_fkey`;
--> statement-breakpoint
ALTER TABLE `meetings` DROP FOREIGN KEY `meetings_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `messages` DROP FOREIGN KEY `messages_author_id_foreign`;
--> statement-breakpoint
ALTER TABLE `messages` DROP FOREIGN KEY `messages_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `notes` DROP FOREIGN KEY `notes_author_id_foreign`;
--> statement-breakpoint
ALTER TABLE `notification_logs` DROP FOREIGN KEY `notification_logs_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_forms` DROP FOREIGN KEY `nps_forms_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_forms` DROP FOREIGN KEY `nps_forms_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_forms` DROP FOREIGN KEY `nps_forms_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_question_responses` DROP FOREIGN KEY `nps_question_responses_nps_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_question_responses` DROP FOREIGN KEY `nps_question_responses_nps_submission_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_questions` DROP FOREIGN KEY `nps_questions_nps_form_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_submissions` DROP FOREIGN KEY `nps_submissions_nps_form_id_foreign`;
--> statement-breakpoint
ALTER TABLE `nps_submissions` DROP FOREIGN KEY `nps_submissions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `opt_in_choices` DROP FOREIGN KEY `opt_in_choices_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `participant_metrics` DROP FOREIGN KEY `participant_metrics_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `participants` DROP FOREIGN KEY `participants_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `placement_statuses` DROP FOREIGN KEY `placement_statuses_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `placement_tags` DROP FOREIGN KEY `placement_tags_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `portfolio_feedback` DROP FOREIGN KEY `portfolio_feedback_submission_id_foreign`;
--> statement-breakpoint
ALTER TABLE `portfolio_feedback` DROP FOREIGN KEY `portfolio_feedback_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `portfolio_student_ias` DROP FOREIGN KEY `portfolio_student_ias_ia_id_foreign`;
--> statement-breakpoint
ALTER TABLE `portfolio_student_ias` DROP FOREIGN KEY `portfolio_student_ias_student_id_foreign`;
--> statement-breakpoint
ALTER TABLE `portfolio_submissions` DROP FOREIGN KEY `portfolio_submissions_student_id_foreign`;
--> statement-breakpoint
ALTER TABLE `position_params` DROP FOREIGN KEY `position_params_position_id_foreign`;
--> statement-breakpoint
ALTER TABLE `positions` DROP FOREIGN KEY `positions_company_id_foreign`;
--> statement-breakpoint
ALTER TABLE `positions` DROP FOREIGN KEY `positions_eligibility_id_foreign`;
--> statement-breakpoint
ALTER TABLE `positions` DROP FOREIGN KEY `positions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `positions_histories` DROP FOREIGN KEY `positions_histories_position_id_foreign`;
--> statement-breakpoint
ALTER TABLE `positions_histories` DROP FOREIGN KEY `positions_histories_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_interviews` DROP FOREIGN KEY `practice_interviews_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_quiz_responses` DROP FOREIGN KEY `practice_quiz_responses_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_test_questions` DROP FOREIGN KEY `pt_questions_sub_topic_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` DROP FOREIGN KEY `pt_progress_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` DROP FOREIGN KEY `pt_progress_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `practice_test_sub_topics` DROP FOREIGN KEY `pt_sub_topics_topic_id_foreign`;
--> statement-breakpoint
ALTER TABLE `problem_links` DROP FOREIGN KEY `problem_links_assignment_id_foreign`;
--> statement-breakpoint
ALTER TABLE `problem_links` DROP FOREIGN KEY `problem_links_problem_id_foreign`;
--> statement-breakpoint
ALTER TABLE `problems` DROP FOREIGN KEY `problems_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `profile_verifies` DROP FOREIGN KEY `profile_verifies_created_by_foreign`;
--> statement-breakpoint
ALTER TABLE `profile_verifies` DROP FOREIGN KEY `profile_verifies_rejected_by_foreign`;
--> statement-breakpoint
ALTER TABLE `profile_verifies` DROP FOREIGN KEY `profile_verifies_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `profile_verifies` DROP FOREIGN KEY `profile_verifies_verified_by_foreign`;
--> statement-breakpoint
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `queries` DROP FOREIGN KEY `queries_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `queries` DROP FOREIGN KEY `queries_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `queries` DROP FOREIGN KEY `queries_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `query_comments` DROP FOREIGN KEY `query_comments_query_id_foreign`;
--> statement-breakpoint
ALTER TABLE `query_comments` DROP FOREIGN KEY `query_comments_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `question_quiz` DROP FOREIGN KEY `question_quiz_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `question_quiz` DROP FOREIGN KEY `question_quiz_quiz_id_foreign`;
--> statement-breakpoint
ALTER TABLE `questions` DROP FOREIGN KEY `questions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quiz_blueprints` DROP FOREIGN KEY `quiz_blueprints_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quiz_blueprints` DROP FOREIGN KEY `quiz_blueprints_quiz_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quiz_blueprints` DROP FOREIGN KEY `quiz_blueprints_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quiz_blueprints_questions` DROP FOREIGN KEY `quiz_blueprints_questions_question_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quiz_blueprints_questions` DROP FOREIGN KEY `quiz_blueprints_questions_quiz_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `quizzes` DROP FOREIGN KEY `quizzes_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` DROP FOREIGN KEY `rbac_role_permissions_permission_id_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` DROP FOREIGN KEY `rbac_role_permissions_role_id_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_roles` DROP FOREIGN KEY `rbac_roles_created_by_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_user_roles` DROP FOREIGN KEY `rbac_user_roles_assigned_by_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_user_roles` DROP FOREIGN KEY `rbac_user_roles_batch_id_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_user_roles` DROP FOREIGN KEY `rbac_user_roles_role_id_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_user_roles` DROP FOREIGN KEY `rbac_user_roles_section_id_fkey`;
--> statement-breakpoint
ALTER TABLE `rbac_user_roles` DROP FOREIGN KEY `rbac_user_roles_user_id_fkey`;
--> statement-breakpoint
ALTER TABLE `scenes` DROP FOREIGN KEY `scenes_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` DROP FOREIGN KEY `section_feedback_blueprints_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` DROP FOREIGN KEY `section_feedback_blueprints_feedback_blueprint_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` DROP FOREIGN KEY `section_feedback_blueprints_feedback_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` DROP FOREIGN KEY `section_feedback_blueprints_quiz_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_user` DROP FOREIGN KEY `section_user_manager_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_user` DROP FOREIGN KEY `section_user_opt_in_choice_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_user` DROP FOREIGN KEY `section_user_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `section_user` DROP FOREIGN KEY `section_user_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `sections` DROP FOREIGN KEY `sections_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `sections` DROP FOREIGN KEY `sections_block_id_foreign`;
--> statement-breakpoint
ALTER TABLE `segments` DROP FOREIGN KEY `segments_scene_id_foreign`;
--> statement-breakpoint
ALTER TABLE `solutions` DROP FOREIGN KEY `solutions_problem_id_foreign`;
--> statement-breakpoint
ALTER TABLE `solutions` DROP FOREIGN KEY `solutions_submission_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_attendances` DROP FOREIGN KEY `student_attendances_batch_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_attendances` DROP FOREIGN KEY `student_attendances_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_attendances` DROP FOREIGN KEY `student_attendances_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_attendances` DROP FOREIGN KEY `student_attendances_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_tag_relation` DROP FOREIGN KEY `student_tag_relation_category_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_tag_relation` DROP FOREIGN KEY `student_tag_relation_name_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_tag_relation` DROP FOREIGN KEY `student_tag_relation_type_id_foreign`;
--> statement-breakpoint
ALTER TABLE `student_tag_relation` DROP FOREIGN KEY `student_tag_relation_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `submissions` DROP FOREIGN KEY `submissions_assignment_id_foreign`;
--> statement-breakpoint
ALTER TABLE `submissions` DROP FOREIGN KEY `submissions_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_assignee_id_fkey`;
--> statement-breakpoint
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_batch_id_fkey`;
--> statement-breakpoint
ALTER TABLE `team_invitations` DROP FOREIGN KEY `team_invitations_team_id_foreign`;
--> statement-breakpoint
ALTER TABLE `threads` DROP FOREIGN KEY `threads_discussion_id_foreign`;
--> statement-breakpoint
ALTER TABLE `threads` DROP FOREIGN KEY `threads_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `ticket_templates` DROP FOREIGN KEY `ticket_templates_created_by_foreign`;
--> statement-breakpoint
ALTER TABLE `ticket_templates` DROP FOREIGN KEY `ticket_templates_updated_by_foreign`;
--> statement-breakpoint
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_agent_id_foreign`;
--> statement-breakpoint
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_assignee_id_foreign`;
--> statement-breakpoint
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `topic_objectives` DROP FOREIGN KEY `topic_objectives_topic_group_index`;
--> statement-breakpoint
ALTER TABLE `unit_movement_rules` DROP FOREIGN KEY `unit_movement_rules_new_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `unit_movement_rules` DROP FOREIGN KEY `unit_movement_rules_opt_in_choice_id_foreign`;
--> statement-breakpoint
ALTER TABLE `unit_movement_rules` DROP FOREIGN KEY `unit_movement_rules_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `unit_movement_user_details` DROP FOREIGN KEY `unit_movement_user_details_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `unit_movement_user_details` DROP FOREIGN KEY `unit_movement_user_details_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_block_emails` DROP FOREIGN KEY `user_block_emails_block_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_block_emails` DROP FOREIGN KEY `user_block_emails_block_unit_movement_email_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_block_emails` DROP FOREIGN KEY `user_block_emails_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_device_tokens` DROP FOREIGN KEY `user_device_tokens_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_documents` DROP FOREIGN KEY `user_documents_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_guardian` DROP FOREIGN KEY `user_guardian_guardian_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_guardian` DROP FOREIGN KEY `user_guardian_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_relation` DROP FOREIGN KEY `user_relation_relation_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_relation` DROP FOREIGN KEY `user_relation_section_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_relation` DROP FOREIGN KEY `user_relation_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_relation_history` DROP FOREIGN KEY `user_relation_history_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_relation_history` DROP FOREIGN KEY `user_relation_history_user_relation_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_scenes` DROP FOREIGN KEY `user_scenes_scene_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_scenes` DROP FOREIGN KEY `user_scenes_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_segments` DROP FOREIGN KEY `user_segments_segment_id_foreign`;
--> statement-breakpoint
ALTER TABLE `user_segments` DROP FOREIGN KEY `user_segments_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `video_attendances` DROP FOREIGN KEY `video_attendances_host_id_foreign`;
--> statement-breakpoint
ALTER TABLE `video_attendances` DROP FOREIGN KEY `video_attendances_lecture_id_foreign`;
--> statement-breakpoint
ALTER TABLE `video_attendances` DROP FOREIGN KEY `video_attendances_user_id_foreign`;
--> statement-breakpoint
ALTER TABLE `adhoc_session_approvers` MODIFY COLUMN `approved` tinyint;--> statement-breakpoint
ALTER TABLE `adhoc_sessions` MODIFY COLUMN `approved` tinyint;--> statement-breakpoint
ALTER TABLE `adhoc_sessions` MODIFY COLUMN `cancelled` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `announcements` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `app_configs` MODIFY COLUMN `forceUpdate` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `app_configs` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `app_configs` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `application_comments` MODIFY COLUMN `read` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `visible` tinyint;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` MODIFY COLUMN `show_scores` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` MODIFY COLUMN `visible` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `show_scores` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `add_to_blueprint` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `enforce_deadline` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `show_submission` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `gets_remaining_time` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `assignments` MODIFY COLUMN `allow_practice` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `attempt` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `correct` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `wrong` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `skipped` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `partial` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `score` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `started` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `completed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `attendances` MODIFY COLUMN `joined_late` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `batch_info` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batch_info_history` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batch_info_template_items` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batch_info_templates` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batch_participants` MODIFY COLUMN `share_application` tinyint;--> statement-breakpoint
ALTER TABLE `batch_participants` MODIFY COLUMN `share_desktop` tinyint;--> statement-breakpoint
ALTER TABLE `batch_participants` MODIFY COLUMN `share_whiteboard` tinyint;--> statement-breakpoint
ALTER TABLE `batch_participants` MODIFY COLUMN `recording` tinyint;--> statement-breakpoint
ALTER TABLE `batch_user` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batch_user` MODIFY COLUMN `is_active` tinyint;--> statement-breakpoint
ALTER TABLE `batch_user_status_logs` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `batches` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` MODIFY COLUMN `terminated` tinyint;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` MODIFY COLUMN `excluded` tinyint;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` MODIFY COLUMN `completed` tinyint;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` MODIFY COLUMN `suspect_list` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` MODIFY COLUMN `new_section_suspect_list` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `block_unit_movement_email_templates` MODIFY COLUMN `variables` json NOT NULL DEFAULT ('undefined');--> statement-breakpoint
ALTER TABLE `block_unit_movement_emails` MODIFY COLUMN `variables` json NOT NULL DEFAULT ('undefined');--> statement-breakpoint
ALTER TABLE `blocks` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `blueprints` MODIFY COLUMN `active` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `bookmarks` MODIFY COLUMN `is_bookmarked` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `comments` MODIFY COLUMN `public` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `discussions` MODIFY COLUMN `is_closed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `discussions` MODIFY COLUMN `public` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` MODIFY COLUMN `terminated` tinyint;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` MODIFY COLUMN `excluded` tinyint;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` MODIFY COLUMN `completed` tinyint;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` MODIFY COLUMN `suspect_list` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` MODIFY COLUMN `new_section_suspect_list` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `failed_jobs` MODIFY COLUMN `failed_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `feedback` MODIFY COLUMN `variables` json NOT NULL DEFAULT ('undefined');--> statement-breakpoint
ALTER TABLE `feedback_blueprints` MODIFY COLUMN `variables` json NOT NULL DEFAULT ('undefined');--> statement-breakpoint
ALTER TABLE `feedback_question_blueprints` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback_questions` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `githubs` MODIFY COLUMN `invitation_accepted` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `guardian` MODIFY COLUMN `verified` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `help_faqs` MODIFY COLUMN `redirection_to_pc` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `help_faqs` MODIFY COLUMN `is_hidden` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `institutes` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` MODIFY COLUMN `visible` tinyint;--> statement-breakpoint
ALTER TABLE `lecture_interactions` MODIFY COLUMN `notes_viewed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `lecture_interactions` MODIFY COLUMN `videos_viewed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `lecture_interactions` MODIFY COLUMN `ai_content_viewed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `lectures` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `lectures` MODIFY COLUMN `add_to_blueprint` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `lectures_ai` MODIFY COLUMN `isConceptsPublished` tinyint;--> statement-breakpoint
ALTER TABLE `lectures_ai` MODIFY COLUMN `isSummaryPublished` tinyint;--> statement-breakpoint
ALTER TABLE `lectures_course` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `menus` MODIFY COLUMN `deprecated` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_logs` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_forms` MODIFY COLUMN `is_active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `nps_forms` MODIFY COLUMN `allow_multiple_attempts` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `nps_forms` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_question_responses` MODIFY COLUMN `answered_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_question_responses` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_questions` MODIFY COLUMN `is_required` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `nps_questions` MODIFY COLUMN `is_scored` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `nps_questions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_submissions` MODIFY COLUMN `is_locked` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `nps_submissions` MODIFY COLUMN `started_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nps_submissions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `pages` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `participant_metrics` MODIFY COLUMN `share_application` tinyint;--> statement-breakpoint
ALTER TABLE `participant_metrics` MODIFY COLUMN `share_desktop` tinyint;--> statement-breakpoint
ALTER TABLE `participant_metrics` MODIFY COLUMN `share_whiteboard` tinyint;--> statement-breakpoint
ALTER TABLE `participant_metrics` MODIFY COLUMN `recording` tinyint;--> statement-breakpoint
ALTER TABLE `portfolio_student_ias` MODIFY COLUMN `is_active` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `bond` tinyint;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` MODIFY COLUMN `isCorrect` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` MODIFY COLUMN `isSkipped` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` MODIFY COLUMN `hasAvailedHint` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` MODIFY COLUMN `isAttempted` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` MODIFY COLUMN `submission_proof` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `problems` MODIFY COLUMN `timing` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `profile_verifies` MODIFY COLUMN `verified` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` MODIFY COLUMN `haveAcceptedLegalAggrement` tinyint;--> statement-breakpoint
ALTER TABLE `query_comments` MODIFY COLUMN `public` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` MODIFY COLUMN `timing` smallint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` MODIFY COLUMN `shuffle` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` MODIFY COLUMN `show_answers` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` MODIFY COLUMN `show_scores` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` MODIFY COLUMN `visible` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `optional` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `shuffle` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `time_limit` mediumint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `show_answers` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `show_scores` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quizzes` MODIFY COLUMN `add_to_blueprint` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `rbac_permissions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_permissions` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_roles` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_roles` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_user_roles` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `rbac_user_roles` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `scenes` MODIFY COLUMN `archived` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` MODIFY COLUMN `variables` json NOT NULL DEFAULT ('undefined');--> statement-breakpoint
ALTER TABLE `section_user` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `section_user` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `section_user` MODIFY COLUMN `permitted` tinyint;--> statement-breakpoint
ALTER TABLE `section_user` MODIFY COLUMN `suspect_list` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `section_user_course` MODIFY COLUMN `permitted` tinyint;--> statement-breakpoint
ALTER TABLE `sections` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sections` MODIFY COLUMN `assignment_percentage_weightage` double(8,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` MODIFY COLUMN `attendance_percentage_weightage` double(8,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` MODIFY COLUMN `unit_movement_completed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `segments` MODIFY COLUMN `archived` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `student_attendances` MODIFY COLUMN `joined_late` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `student_attendances` MODIFY COLUMN `include_video_attendance` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `student_attendances` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `student_tag_categories` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `student_tag_names` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `student_tag_relation` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `student_tag_relation` MODIFY COLUMN `global` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `student_tag_relation` MODIFY COLUMN `visible_to_student` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `student_tag_types` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `submissions` MODIFY COLUMN `score` double NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` MODIFY COLUMN `started` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` MODIFY COLUMN `completed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` MODIFY COLUMN `mark_as_completed` tinyint;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `teams` MODIFY COLUMN `personal_team` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `threads` MODIFY COLUMN `public` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `is_closed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `unit_movement_rules` MODIFY COLUMN `mark_users_async_on_new_section` tinyint;--> statement-breakpoint
ALTER TABLE `unit_movement_rules` MODIFY COLUMN `completed` tinyint;--> statement-breakpoint
ALTER TABLE `user_device_tokens` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `user_device_tokens` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_relation` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users_course` MODIFY COLUMN `id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `client` varchar(20) DEFAULT 'masai' NOT NULL;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubs` ADD CONSTRAINT `clubs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_enrollments` ADD CONSTRAINT `event_enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_enrollments` ADD CONSTRAINT `event_enrollments_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_reply_id_replies_id_fk` FOREIGN KEY (`reply_id`) REFERENCES `replies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_banned_by_users_id_fk` FOREIGN KEY (`banned_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replies` ADD CONSTRAINT `replies_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replies` ADD CONSTRAINT `replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_reply_id_replies_id_fk` FOREIGN KEY (`reply_id`) REFERENCES `replies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `club_members_club_id_index` ON `club_members` (`club_id`);--> statement-breakpoint
CREATE INDEX `clubs_created_by_index` ON `clubs` (`created_by`);--> statement-breakpoint
CREATE INDEX `event_enrollments_event_id_index` ON `event_enrollments` (`event_id`);--> statement-breakpoint
CREATE INDEX `events_club_id_index` ON `events` (`club_id`);--> statement-breakpoint
CREATE INDEX `events_created_by_index` ON `events` (`created_by`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_user_id_index` ON `masaiverse_leaderboard` (`user_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_created_by_index` ON `masaiverse_leaderboard` (`created_by`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_post_id_index` ON `masaiverse_leaderboard` (`post_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_reply_id_index` ON `masaiverse_leaderboard` (`reply_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_event_id_index` ON `masaiverse_leaderboard` (`event_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_reason_index` ON `masaiverse_leaderboard` (`reason`);--> statement-breakpoint
CREATE INDEX `otp_codes_identifier_index` ON `otp_codes` (`identifier`);--> statement-breakpoint
CREATE INDEX `posts_banned_by_index` ON `posts` (`banned_by`);--> statement-breakpoint
CREATE INDEX `posts_club_id_index` ON `posts` (`club_id`);--> statement-breakpoint
CREATE INDEX `posts_user_id_index` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `replies_post_id_index` ON `replies` (`post_id`);--> statement-breakpoint
CREATE INDEX `replies_user_id_index` ON `replies` (`user_id`);--> statement-breakpoint
CREATE INDEX `votes_post_id_index` ON `votes` (`post_id`);--> statement-breakpoint
CREATE INDEX `votes_reply_id_index` ON `votes` (`reply_id`);--> statement-breakpoint
ALTER TABLE `access_logs` ADD CONSTRAINT `access_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_approvers` ADD CONSTRAINT `adhoc_session_approvers_adhoc_session_id_adhoc_sessions_id_fk` FOREIGN KEY (`adhoc_session_id`) REFERENCES `adhoc_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_approvers` ADD CONSTRAINT `adhoc_session_approvers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_batches` ADD CONSTRAINT `adhoc_session_batches_adhoc_session_id_adhoc_sessions_id_fk` FOREIGN KEY (`adhoc_session_id`) REFERENCES `adhoc_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_batches` ADD CONSTRAINT `adhoc_session_batches_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_blocks` ADD CONSTRAINT `adhoc_session_blocks_adhoc_session_id_adhoc_sessions_id_fk` FOREIGN KEY (`adhoc_session_id`) REFERENCES `adhoc_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_blocks` ADD CONSTRAINT `adhoc_session_blocks_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_sections` ADD CONSTRAINT `adhoc_session_sections_adhoc_session_id_adhoc_sessions_id_fk` FOREIGN KEY (`adhoc_session_id`) REFERENCES `adhoc_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_sections` ADD CONSTRAINT `adhoc_session_sections_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_users` ADD CONSTRAINT `adhoc_session_users_adhoc_session_id_adhoc_sessions_id_fk` FOREIGN KEY (`adhoc_session_id`) REFERENCES `adhoc_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_session_users` ADD CONSTRAINT `adhoc_session_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_sessions` ADD CONSTRAINT `adhoc_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adhoc_sessions` ADD CONSTRAINT `adhoc_sessions_adhoc_session_blueprint_id_adhoc_session_blueprints_id_fk` FOREIGN KEY (`adhoc_session_blueprint_id`) REFERENCES `adhoc_session_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` ADD CONSTRAINT `ai_chat_practice_questions_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` ADD CONSTRAINT `ai_chat_practice_questions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_feedback` ADD CONSTRAINT `ai_feedback_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_feedback` ADD CONSTRAINT `ai_feedback_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_practice_questions` ADD CONSTRAINT `ai_practice_questions_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_practice_questions` ADD CONSTRAINT `ai_practice_questions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` ADD CONSTRAINT `ai_tutor_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` ADD CONSTRAINT `ai_tutor_sessions_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_attempt_id_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_comments` ADD CONSTRAINT `application_comments_application_id_applications_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_comments` ADD CONSTRAINT `application_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_histories` ADD CONSTRAINT `application_histories_application_id_applications_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_histories` ADD CONSTRAINT `application_histories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` ADD CONSTRAINT `assignment_blueprints_blueprint_id_blueprints_id_fk` FOREIGN KEY (`blueprint_id`) REFERENCES `blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` ADD CONSTRAINT `assignment_blueprints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_blueprints` ADD CONSTRAINT `assignment_blueprints_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_blueprints_problems` ADD CONSTRAINT `assignment_blueprints_problems_assignment_blueprint_id_assignment_blueprints_id_fk` FOREIGN KEY (`assignment_blueprint_id`) REFERENCES `assignment_blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_blueprints_problems` ADD CONSTRAINT `assignment_blueprints_problems_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_problem` ADD CONSTRAINT `assignment_problem_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_problem` ADD CONSTRAINT `assignment_problem_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info` ADD CONSTRAINT `batch_info_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info` ADD CONSTRAINT `batch_info_maker_id_users_id_fk` FOREIGN KEY (`maker_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info` ADD CONSTRAINT `batch_info_checker_id_users_id_fk` FOREIGN KEY (`checker_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info_history` ADD CONSTRAINT `batch_info_history_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info_history` ADD CONSTRAINT `batch_info_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_info_template_items` ADD CONSTRAINT `batch_info_template_items_batch_info_template_id_batch_info_templates_id_fk` FOREIGN KEY (`batch_info_template_id`) REFERENCES `batch_info_templates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_participants` ADD CONSTRAINT `batch_participants_lecture_id_meetings_lecture_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `meetings`(`lecture_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_user` ADD CONSTRAINT `batch_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_user` ADD CONSTRAINT `batch_user_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` ADD CONSTRAINT `block_draft_unit_movements_draft_unit_movement_id_draft_unit_movements_id_fk` FOREIGN KEY (`draft_unit_movement_id`) REFERENCES `draft_unit_movements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` ADD CONSTRAINT `block_draft_unit_movements_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` ADD CONSTRAINT `block_draft_unit_movements_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` ADD CONSTRAINT `block_draft_unit_movements_new_section_id_sections_id_fk` FOREIGN KEY (`new_section_id`) REFERENCES `sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_draft_unit_movements` ADD CONSTRAINT `block_draft_unit_movements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `block_unit_movement_emails` ADD CONSTRAINT `block_unit_movement_emails_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blueprints` ADD CONSTRAINT `blueprints_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blueprints` ADD CONSTRAINT `blueprints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disbursal_statuses` ADD CONSTRAINT `disbursal_statuses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` ADD CONSTRAINT `draft_unit_movements_unit_movement_rule_id_unit_movement_rules_id_fk` FOREIGN KEY (`unit_movement_rule_id`) REFERENCES `unit_movement_rules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` ADD CONSTRAINT `draft_unit_movements_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` ADD CONSTRAINT `draft_unit_movements_new_section_id_sections_id_fk` FOREIGN KEY (`new_section_id`) REFERENCES `sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draft_unit_movements` ADD CONSTRAINT `draft_unit_movements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_entity` ADD CONSTRAINT `elective_entity_elective_id_electives_id_fk` FOREIGN KEY (`elective_id`) REFERENCES `electives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_progress` ADD CONSTRAINT `elective_progress_elective_user_id_elective_user_id_fk` FOREIGN KEY (`elective_user_id`) REFERENCES `elective_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_progress` ADD CONSTRAINT `elective_progress_elective_entity_id_elective_entity_id_fk` FOREIGN KEY (`elective_entity_id`) REFERENCES `elective_entity`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_section` ADD CONSTRAINT `elective_section_elective_id_electives_id_fk` FOREIGN KEY (`elective_id`) REFERENCES `electives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_section` ADD CONSTRAINT `elective_section_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_section` ADD CONSTRAINT `elective_section_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_user` ADD CONSTRAINT `elective_user_elective_id_electives_id_fk` FOREIGN KEY (`elective_id`) REFERENCES `electives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `elective_user` ADD CONSTRAINT `elective_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `electives` ADD CONSTRAINT `electives_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `external_offers` ADD CONSTRAINT `external_offers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `external_offers` ADD CONSTRAINT `external_offers_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `external_offers` ADD CONSTRAINT `external_offers_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_feedback_blueprint_id_feedback_blueprints_id_fk` FOREIGN KEY (`feedback_blueprint_id`) REFERENCES `feedback_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_question_blueprints` ADD CONSTRAINT `feedback_question_blueprints_feedback_blueprint_id_feedback_blueprints_id_fk` FOREIGN KEY (`feedback_blueprint_id`) REFERENCES `feedback_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_questions` ADD CONSTRAINT `feedback_questions_feedback_id_feedback_id_fk` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_questions` ADD CONSTRAINT `feedback_questions_feedback_question_blueprint_id_feedback_question_blueprints_id_fk` FOREIGN KEY (`feedback_question_blueprint_id`) REFERENCES `feedback_question_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_responses` ADD CONSTRAINT `feedback_responses_feedback_id_feedback_id_fk` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_responses` ADD CONSTRAINT `feedback_responses_feedback_question_id_feedback_questions_id_fk` FOREIGN KEY (`feedback_question_id`) REFERENCES `feedback_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_responses` ADD CONSTRAINT `feedback_responses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flag_query` ADD CONSTRAINT `flag_query_flag_id_flags_id_fk` FOREIGN KEY (`flag_id`) REFERENCES `flags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flag_query` ADD CONSTRAINT `flag_query_query_id_queries_id_fk` FOREIGN KEY (`query_id`) REFERENCES `queries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flags` ADD CONSTRAINT `flags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flags` ADD CONSTRAINT `flags_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flags` ADD CONSTRAINT `flags_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `githubs` ADD CONSTRAINT `githubs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guardian` ADD CONSTRAINT `guardian_guardian_id_users_id_fk` FOREIGN KEY (`guardian_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `help_faqs` ADD CONSTRAINT `help_faqs_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institute_batches` ADD CONSTRAINT `institute_batches_institute_id_institutes_id_fk` FOREIGN KEY (`institute_id`) REFERENCES `institutes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `institute_batches` ADD CONSTRAINT `institute_batches_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interaction_messages` ADD CONSTRAINT `interaction_messages_interaction_id_interactions_id_fk` FOREIGN KEY (`interaction_id`) REFERENCES `interactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interaction_messages` ADD CONSTRAINT `interaction_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interactions` ADD CONSTRAINT `interactions_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_application_id_applications_id_fk` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_objectives` ADD CONSTRAINT `learning_objectives_topic_id_topic_objectives_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topic_objectives`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_ai_generated_content` ADD CONSTRAINT `lecture_ai_generated_content_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` ADD CONSTRAINT `lecture_blueprints_blueprint_id_blueprints_id_fk` FOREIGN KEY (`blueprint_id`) REFERENCES `blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` ADD CONSTRAINT `lecture_blueprints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` ADD CONSTRAINT `lecture_blueprints_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_blueprints` ADD CONSTRAINT `lecture_blueprints_section_feedback_blueprint_id_section_feedback_blueprints_id_fk` FOREIGN KEY (`section_feedback_blueprint_id`) REFERENCES `section_feedback_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_feedback` ADD CONSTRAINT `lecture_feedback_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_feedback` ADD CONSTRAINT `lecture_feedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_interactions` ADD CONSTRAINT `lecture_interactions_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_interactions` ADD CONSTRAINT `lecture_interactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_feedback_id_feedback_id_fk` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures_ai` ADD CONSTRAINT `lectures_ai_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_forms` ADD CONSTRAINT `nps_forms_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_forms` ADD CONSTRAINT `nps_forms_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_forms` ADD CONSTRAINT `nps_forms_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_question_responses` ADD CONSTRAINT `nps_question_responses_nps_submission_id_nps_submissions_id_fk` FOREIGN KEY (`nps_submission_id`) REFERENCES `nps_submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_question_responses` ADD CONSTRAINT `nps_question_responses_nps_question_id_nps_questions_id_fk` FOREIGN KEY (`nps_question_id`) REFERENCES `nps_questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_questions` ADD CONSTRAINT `nps_questions_nps_form_id_nps_forms_id_fk` FOREIGN KEY (`nps_form_id`) REFERENCES `nps_forms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_submissions` ADD CONSTRAINT `nps_submissions_nps_form_id_nps_forms_id_fk` FOREIGN KEY (`nps_form_id`) REFERENCES `nps_forms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nps_submissions` ADD CONSTRAINT `nps_submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opt_in_choices` ADD CONSTRAINT `opt_in_choices_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participant_metrics` ADD CONSTRAINT `participant_metrics_lecture_id_meetings_lecture_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `meetings`(`lecture_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `participants` ADD CONSTRAINT `participants_lecture_id_meetings_lecture_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `meetings`(`lecture_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `placement_statuses` ADD CONSTRAINT `placement_statuses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `placement_tags` ADD CONSTRAINT `placement_tags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_feedback` ADD CONSTRAINT `portfolio_feedback_submission_id_portfolio_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `portfolio_submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_feedback` ADD CONSTRAINT `portfolio_feedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_student_ias` ADD CONSTRAINT `portfolio_student_ias_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_student_ias` ADD CONSTRAINT `portfolio_student_ias_ia_id_users_id_fk` FOREIGN KEY (`ia_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_submissions` ADD CONSTRAINT `portfolio_submissions_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `position_params` ADD CONSTRAINT `position_params_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_eligibility_id_eligibilities_id_fk` FOREIGN KEY (`eligibility_id`) REFERENCES `eligibilities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions_histories` ADD CONSTRAINT `positions_histories_position_id_positions_id_fk` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions_histories` ADD CONSTRAINT `positions_histories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_interviews` ADD CONSTRAINT `practice_interviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_quiz_responses` ADD CONSTRAINT `practice_quiz_responses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_test_questions` ADD CONSTRAINT `practice_test_questions_practice_sub_topic_id_practice_test_sub_topics_id_fk` FOREIGN KEY (`practice_sub_topic_id`) REFERENCES `practice_test_sub_topics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` ADD CONSTRAINT `practice_test_questions_users_attempted_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_test_questions_users_attempted` ADD CONSTRAINT `practice_test_questions_users_attempted_practice_test_question_id_practice_test_questions_id_fk` FOREIGN KEY (`practice_test_question_id`) REFERENCES `practice_test_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_test_sub_topics` ADD CONSTRAINT `practice_test_sub_topics_practice_topic_id_practice_test_topics_id_fk` FOREIGN KEY (`practice_topic_id`) REFERENCES `practice_test_topics`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_links` ADD CONSTRAINT `problem_links_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problem_links` ADD CONSTRAINT `problem_links_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problems` ADD CONSTRAINT `problems_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_verifies` ADD CONSTRAINT `profile_verifies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_verifies` ADD CONSTRAINT `profile_verifies_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_verifies` ADD CONSTRAINT `profile_verifies_verified_by_users_id_fk` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profile_verifies` ADD CONSTRAINT `profile_verifies_rejected_by_users_id_fk` FOREIGN KEY (`rejected_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `queries` ADD CONSTRAINT `queries_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `queries` ADD CONSTRAINT `queries_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `queries` ADD CONSTRAINT `queries_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `query_comments` ADD CONSTRAINT `query_comments_query_id_queries_id_fk` FOREIGN KEY (`query_id`) REFERENCES `queries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `query_comments` ADD CONSTRAINT `query_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_quiz` ADD CONSTRAINT `question_quiz_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_quiz` ADD CONSTRAINT `question_quiz_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` ADD CONSTRAINT `quiz_blueprints_blueprint_id_blueprints_id_fk` FOREIGN KEY (`blueprint_id`) REFERENCES `blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` ADD CONSTRAINT `quiz_blueprints_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_blueprints` ADD CONSTRAINT `quiz_blueprints_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_blueprints_questions` ADD CONSTRAINT `quiz_blueprints_questions_quiz_blueprint_id_quiz_blueprints_id_fk` FOREIGN KEY (`quiz_blueprint_id`) REFERENCES `quiz_blueprints`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_blueprints_questions` ADD CONSTRAINT `quiz_blueprints_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` ADD CONSTRAINT `rbac_role_permissions_role_id_rbac_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_role_permissions` ADD CONSTRAINT `rbac_role_permissions_permission_id_rbac_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `rbac_permissions`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_roles` ADD CONSTRAINT `rbac_roles_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_user_roles` ADD CONSTRAINT `rbac_user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_user_roles` ADD CONSTRAINT `rbac_user_roles_role_id_rbac_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `rbac_roles`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_user_roles` ADD CONSTRAINT `rbac_user_roles_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_user_roles` ADD CONSTRAINT `rbac_user_roles_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rbac_user_roles` ADD CONSTRAINT `rbac_user_roles_assigned_by_users_id_fk` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `scenes` ADD CONSTRAINT `scenes_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` ADD CONSTRAINT `section_feedback_blueprints_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` ADD CONSTRAINT `section_feedback_blueprints_feedback_blueprint_id_feedback_blueprints_id_fk` FOREIGN KEY (`feedback_blueprint_id`) REFERENCES `feedback_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` ADD CONSTRAINT `section_feedback_blueprints_blueprint_id_blueprints_id_fk` FOREIGN KEY (`blueprint_id`) REFERENCES `blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_feedback_blueprints` ADD CONSTRAINT `section_feedback_blueprints_feedback_id_feedback_id_fk` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_manager_id_users_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_opt_in_choice_id_opt_in_choices_id_fk` FOREIGN KEY (`opt_in_choice_id`) REFERENCES `opt_in_choices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sections` ADD CONSTRAINT `sections_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sections` ADD CONSTRAINT `sections_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `segments` ADD CONSTRAINT `segments_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solutions` ADD CONSTRAINT `solutions_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solutions` ADD CONSTRAINT `solutions_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_tag_relation` ADD CONSTRAINT `student_tag_relation_name_id_student_tag_names_id_fk` FOREIGN KEY (`name_id`) REFERENCES `student_tag_names`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_tag_relation` ADD CONSTRAINT `student_tag_relation_type_id_student_tag_types_id_fk` FOREIGN KEY (`type_id`) REFERENCES `student_tag_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_tag_relation` ADD CONSTRAINT `student_tag_relation_category_id_student_tag_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `student_tag_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_tag_relation` ADD CONSTRAINT `student_tag_relation_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_invitations` ADD CONSTRAINT `team_invitations_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `threads` ADD CONSTRAINT `threads_discussion_id_discussions_id_fk` FOREIGN KEY (`discussion_id`) REFERENCES `discussions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `threads` ADD CONSTRAINT `threads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_templates` ADD CONSTRAINT `ticket_templates_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_templates` ADD CONSTRAINT `ticket_templates_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_agent_id_users_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `topic_objectives` ADD CONSTRAINT `topic_objectives_topic_group_menus_id_fk` FOREIGN KEY (`topic_group`) REFERENCES `menus`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_movement_rules` ADD CONSTRAINT `unit_movement_rules_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_movement_rules` ADD CONSTRAINT `unit_movement_rules_new_section_id_sections_id_fk` FOREIGN KEY (`new_section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_movement_rules` ADD CONSTRAINT `unit_movement_rules_opt_in_choice_id_opt_in_choices_id_fk` FOREIGN KEY (`opt_in_choice_id`) REFERENCES `opt_in_choices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_movement_user_details` ADD CONSTRAINT `unit_movement_user_details_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `unit_movement_user_details` ADD CONSTRAINT `unit_movement_user_details_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_block_emails` ADD CONSTRAINT `user_block_emails_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_block_emails` ADD CONSTRAINT `user_block_emails_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_block_emails` ADD CONSTRAINT `user_block_emails_block_unit_movement_email_id_block_unit_movement_emails_id_fk` FOREIGN KEY (`block_unit_movement_email_id`) REFERENCES `block_unit_movement_emails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_device_tokens` ADD CONSTRAINT `user_device_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_documents` ADD CONSTRAINT `user_documents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_guardian` ADD CONSTRAINT `user_guardian_guardian_id_guardian_guardian_id_fk` FOREIGN KEY (`guardian_id`) REFERENCES `guardian`(`guardian_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_guardian` ADD CONSTRAINT `user_guardian_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_relation` ADD CONSTRAINT `user_relation_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_relation` ADD CONSTRAINT `user_relation_relation_id_student_tag_relation_id_fk` FOREIGN KEY (`relation_id`) REFERENCES `student_tag_relation`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_relation` ADD CONSTRAINT `user_relation_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_relation_history` ADD CONSTRAINT `user_relation_history_user_relation_id_user_relation_id_fk` FOREIGN KEY (`user_relation_id`) REFERENCES `user_relation`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_relation_history` ADD CONSTRAINT `user_relation_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scenes` ADD CONSTRAINT `user_scenes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_scenes` ADD CONSTRAINT `user_scenes_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_segments` ADD CONSTRAINT `user_segments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_segments` ADD CONSTRAINT `user_segments_segment_id_segments_id_fk` FOREIGN KEY (`segment_id`) REFERENCES `segments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_client` ON `users` (`client`);