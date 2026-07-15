CREATE TABLE `ai_chat_practice_questions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`lectureId` int unsigned NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`chatHistory` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	`feedback` varchar(191),
	`feedback_time` timestamp,
	`rating` int,
	CONSTRAINT `ai_chat_practice_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_tutor_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`unique_id` varchar(255) NOT NULL,
	`session_id` varchar(255),
	`room_name` varchar(255),
	`token` text,
	`websocket_url` varchar(500),
	`language` varchar(50),
	`duration_minutes` int,
	`participant_name` varchar(255),
	`error_message` text,
	`rating` tinyint unsigned,
	`feedback` text,
	`feedback_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `ai_tutor_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcement_reads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`announcement_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`read_at` datetime,
	`is_unread` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`popup_display` tinyint,
	`meta` json,
	CONSTRAINT `announcement_reads_id` PRIMARY KEY(`id`),
	CONSTRAINT `announcement_reads_announcement_id_user_id_unique` UNIQUE(`announcement_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`tags` varchar(255),
	`optional` tinyint NOT NULL DEFAULT 0,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`user_id` bigint unsigned NOT NULL,
	`week` tinyint unsigned NOT NULL,
	`day` tinyint unsigned NOT NULL,
	`schedule` datetime,
	`concludes` datetime,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`cta_link` varchar(255),
	`cta_name` varchar(255),
	`meta` json,
	`show_as_popup` tinyint NOT NULL DEFAULT 0,
	`track_read` tinyint,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assess_nps_form` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`user_id` bigint unsigned NOT NULL,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`template_id` varchar(191),
	`client_id` varchar(191),
	`starts_at` datetime,
	`ends_at` datetime,
	`allow_multiple_attempts` tinyint NOT NULL DEFAULT 0,
	`max_attempts` int,
	`settings` json,
	`meta` json,
	`logs` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	`deleted_at` timestamp,
	CONSTRAINT `assess_nps_form_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assess_nps_submissions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`nps_form_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`template_id` varchar(191),
	`client_id` varchar(191),
	`assess_link` text,
	`assess_callback` text,
	`starts_at` datetime,
	`completed_at` datetime,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `assess_nps_submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `assess_nps_submissions_form_user_unique` UNIQUE(`nps_form_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `assignment_problem` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`assignment_id` int unsigned NOT NULL,
	`problem_id` int unsigned NOT NULL,
	`priority` tinyint unsigned NOT NULL DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `assignment_problem_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`tags` varchar(255),
	`instructions` text,
	`optional` tinyint NOT NULL DEFAULT 0,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`user_id` bigint unsigned NOT NULL,
	`week` tinyint unsigned NOT NULL,
	`day` tinyint unsigned NOT NULL,
	`show_scores` tinyint NOT NULL DEFAULT 0,
	`schedule` datetime,
	`concludes` datetime,
	`settings` json,
	`data` json,
	`buckets` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`weightage` int NOT NULL DEFAULT 0,
	`start_date` date,
	`end_date` date,
	`start_time` int,
	`end_time` int,
	`add_to_blueprint` tinyint NOT NULL DEFAULT 1,
	`enforce_deadline` tinyint DEFAULT 1,
	`show_submission` tinyint NOT NULL DEFAULT 0,
	`platform` varchar(191),
	`gets_remaining_time` tinyint NOT NULL DEFAULT 0,
	`allow_practice` tinyint NOT NULL DEFAULT 0,
	`learning_objectives` json,
	`module` varchar(255),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`user_id` bigint unsigned,
	`host_id` bigint unsigned,
	`category` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`section_id` int unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`status` int NOT NULL,
	`schedule` datetime NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`joined_late` tinyint NOT NULL DEFAULT 0,
	`late_by_minutes` int unsigned,
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendances_lecture_id_user_id_key` UNIQUE(`lecture_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `badge_configs` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`badge_id` int unsigned NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`section_id` int unsigned,
	`lecture_criteria` enum('none','mandatory','recommended','both') NOT NULL DEFAULT 'none',
	`lecture_criteria_percentage` double,
	`assignment_criteria` enum('none','mandatory','recommended','both') NOT NULL DEFAULT 'none',
	`assignment_submission_criteria_percentage` double,
	`assignment_score_criteria_percentage` double,
	`created_at` timestamp,
	`updated_at` timestamp,
	`assignment_types_criteria` json,
	CONSTRAINT `badge_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_configs_badge_id_section_id_unique` UNIQUE(`badge_id`,`section_id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`image` varchar(2048) NOT NULL,
	`linkedin_share_text` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	`locked_badge_description` text,
	`theme` varchar(255),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`variant` varchar(100),
	`group_name` varchar(150),
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`cta_url` varchar(500) NOT NULL,
	`visible_to` json NOT NULL,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`start_date` datetime,
	`end_date` datetime,
	`data` json,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`),
	CONSTRAINT `banners_group_name_key` UNIQUE(`group_name`)
);
--> statement-breakpoint
CREATE TABLE `batch_user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`deleted_at` datetime,
	`username` varchar(300),
	`admission` varchar(300),
	`role` varchar(300),
	`in_time` datetime,
	`out_time` datetime,
	`is_active` tinyint,
	`meta` varchar(300),
	`user_id` bigint unsigned NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`history` json,
	`status` varchar(300),
	CONSTRAINT `batch_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`starting` date NOT NULL,
	`duration` varchar(255) NOT NULL,
	`program` varchar(255) NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`options` json,
	`meta` json,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`ending` date,
	`mode` varchar(255),
	`model` varchar(255),
	`duration_months` int,
	`iteration` int,
	`language` varchar(50),
	`partners` varchar(255),
	`program_domain` varchar(255),
	`program_type` varchar(255),
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocks` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`starting` date NOT NULL,
	`ending` date NOT NULL,
	`duration` varchar(255) NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`options` json,
	`meta` json,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`entity_type` varchar(255) NOT NULL,
	`entity_id` bigint unsigned NOT NULL,
	`is_bookmarked` tinyint NOT NULL DEFAULT 1,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `club_members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`club_id` bigint unsigned NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'member',
	`joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`ticket_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`status` varchar(255),
	`public` tinyint NOT NULL DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`entity_type` varchar(255) NOT NULL,
	`entity_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`status` varchar(255),
	`is_closed` tinyint NOT NULL DEFAULT 0,
	`public` tinyint NOT NULL DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`assignee_id` bigint unsigned,
	`gpt_central_data` json,
	CONSTRAINT `discussions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_enrollments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`event_id` bigint unsigned NOT NULL,
	`enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
	`image_link` text,
	`category` varchar(255),
	`mode` enum('online','offline'),
	`location_title` varchar(255),
	`location_map_link` text,
	`event_link` text,
	`platform` varchar(50),
	`start_time` timestamp,
	`end_time` timestamp,
	`meta` json,
	`created_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`variables` json NOT NULL DEFAULT (json_array()),
	`settings` json,
	`quiz_id` int unsigned,
	`feedback_blueprint_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	`start_time` datetime,
	`end_time` datetime,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_blueprints` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`variables` json NOT NULL DEFAULT (json_array()),
	`settings` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `feedback_blueprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `help_faqs` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`category` varchar(255) NOT NULL,
	`sub_category` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`assignees` json,
	`batch_id` int unsigned NOT NULL,
	`redirection_to_pc` tinyint NOT NULL DEFAULT 0,
	`is_hidden` tinyint NOT NULL DEFAULT 0,
	`meta` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `help_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lecture_feedback` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`response` json,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	`feedback` varchar(191),
	`rating` int NOT NULL DEFAULT 0,
	CONSTRAINT `lecture_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lecture_zoom_chat` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`meeting_id` varchar(255),
	`original_chat` json NOT NULL,
	`final_chat` json NOT NULL,
	`last_edited_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `lecture_zoom_chat_id` PRIMARY KEY(`id`),
	CONSTRAINT `lecture_zoom_chat_lecture_id_unique` UNIQUE(`lecture_id`)
);
--> statement-breakpoint
CREATE TABLE `lectures` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`tags` varchar(255),
	`description` text,
	`optional` tinyint NOT NULL DEFAULT 0,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`user_id` bigint unsigned NOT NULL,
	`week` tinyint unsigned NOT NULL,
	`day` tinyint unsigned NOT NULL,
	`schedule` datetime,
	`concludes` datetime,
	`zoom_link` varchar(255),
	`notes` text,
	`videos` json,
	`settings` json,
	`data` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`vimeo_player_embed_url` varchar(255),
	`vimeo_download_links` json,
	`feedback_id` bigint unsigned,
	`start_date` date,
	`end_date` date,
	`start_time` int,
	`end_time` int,
	`add_to_blueprint` tinyint NOT NULL DEFAULT 1,
	`gpt_central_data` json,
	`host_id` bigint unsigned,
	`feedback_response_trousers` json,
	`learning_objectives` json,
	`module` varchar(255),
	`faculty_resources` json,
	`assessments` json,
	`is_new_zoom_redirection` tinyint,
	`zoom_details` json,
	CONSTRAINT `lectures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lectures_ai` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`transcript` longtext,
	`summary` longtext,
	`concepts` json,
	`lectureId` int unsigned NOT NULL,
	`isConceptsPublished` tinyint,
	`isSummaryPublished` tinyint,
	`transcriptSegments` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	`lastRefetchTime` datetime,
	`transcriptId` varchar(191),
	CONSTRAINT `lectures_ai_id` PRIMARY KEY(`id`),
	CONSTRAINT `lectures_ai_lectureId_key` UNIQUE(`lectureId`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`ip_address` varchar(45),
	`attempted_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masaiverse_banners` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`cta_text` varchar(255),
	`cta_url` text,
	`start_date` timestamp,
	`end_date` timestamp,
	`meta` json,
	`created_by` bigint unsigned,
	`last_edited_by` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `masaiverse_banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masaiverse_leaderboard` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_by` bigint unsigned,
	`reason` varchar(50) NOT NULL,
	`points` int NOT NULL,
	`club_id` bigint unsigned,
	`post_id` bigint unsigned,
	`reply_id` bigint unsigned,
	`event_id` bigint unsigned,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `masaiverse_leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`category` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`ordering` mediumint NOT NULL,
	`data` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deprecated` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`author_id` bigint unsigned NOT NULL,
	`priority` varchar(255),
	`read_at` datetime,
	`meta` json,
	`message_id` bigint unsigned,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`cta_link` varchar(255),
	`cta_name` varchar(255),
	`show_as_popup` tinyint NOT NULL DEFAULT 0,
	`concludes` datetime,
	`schedule` datetime,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`notification_type` varchar(50) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`data` json,
	`status` varchar(50) NOT NULL,
	`sent_at` timestamp,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_logs_unique_notification` UNIQUE(`user_id`,`notification_type`,`entity_id`)
);
--> statement-breakpoint
CREATE TABLE `opt_in_choices` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`section_id` int unsigned NOT NULL,
	`track_name` varchar(255) NOT NULL,
	`track_description` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `opt_in_choices_id` PRIMARY KEY(`id`)
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
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `otp_codes_session_id_key` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`club_id` bigint unsigned,
	`user_id` bigint unsigned NOT NULL,
	`title` text,
	`content` text,
	`is_banned` tinyint NOT NULL DEFAULT 0,
	`banned_by` bigint unsigned,
	`banned_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	`meta` json,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`statement` text NOT NULL,
	`category` varchar(255) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`tags` varchar(255),
	`description` text,
	`approach` text,
	`rubrics` text,
	`type` enum('LINK','FILE','BUTTON') NOT NULL DEFAULT 'LINK',
	`submission_proof` tinyint NOT NULL DEFAULT 0,
	`submission_instructions` text,
	`marks` tinyint unsigned NOT NULL DEFAULT 1,
	`timing` smallint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`options` json,
	`meta` json,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `problems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`birth_date` date,
	`gender` enum('MALE','FEMALE','OTHER') NOT NULL DEFAULT 'OTHER',
	`education` json,
	`experience` json,
	`family` json,
	`finance` json,
	`isa` json,
	`social_media` json,
	`meta` json,
	`info` json,
	`data` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`isa_status` varchar(255),
	`isa_signing_time` timestamp,
	`graduation_time` timestamp,
	`placement_time` timestamp,
	`dropout_time` timestamp,
	`placement` json,
	`address` json,
	`placement_status` varchar(255),
	`placement_sub_status` varchar(255),
	`secondary_email` varchar(255),
	`secondary_mobile` varchar(255),
	`documents` json,
	`declaration` json,
	`stage` varchar(255),
	`disbursal_status` varchar(255),
	`resume_builder_id` varchar(255),
	`personal_info` json,
	`haveAcceptedLegalAggrement` tinyint,
	`haveClosedModal` int unsigned,
	`legal_data` json,
	`slack_id` varchar(255),
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`tags` varchar(255),
	`instructions` text,
	`optional` tinyint NOT NULL DEFAULT 0,
	`batch_id` int unsigned,
	`section_id` int unsigned,
	`user_id` bigint unsigned NOT NULL,
	`week` tinyint unsigned NOT NULL,
	`day` tinyint unsigned NOT NULL,
	`shuffle` tinyint NOT NULL DEFAULT 0,
	`time_limit` mediumint unsigned NOT NULL,
	`show_answers` tinyint NOT NULL DEFAULT 0,
	`show_scores` tinyint NOT NULL DEFAULT 0,
	`schedule` datetime,
	`concludes` datetime,
	`settings` json,
	`data` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`start_date` date,
	`end_date` date,
	`start_time` int,
	`end_time` int,
	`add_to_blueprint` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`post_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`content` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `section_user` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`section_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`manager_id` bigint unsigned,
	`role` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`current_async_count` int NOT NULL DEFAULT 0,
	`opt_in_choice_id` bigint unsigned,
	`permitted` tinyint,
	`suspect_list` tinyint NOT NULL DEFAULT 0,
	`meta` json,
	CONSTRAINT `section_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`type` varchar(255) NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`settings` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`block_id` int unsigned,
	`assignment_percentage_weightage` double(8,2) NOT NULL,
	`attendance_percentage_weightage` double(8,2) NOT NULL,
	`opt_in_start_datetime` timestamp,
	`opt_in_end_datetime` timestamp,
	`day_block` varchar(255),
	`start_time` int,
	`end_time` int,
	`level` double(8,2),
	`course_type` varchar(255),
	`unit_movement_completed` tinyint NOT NULL DEFAULT 0,
	`module` varchar(255),
	CONSTRAINT `sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` bigint unsigned,
	`ip_address` varchar(45),
	`user_agent` text,
	`payload` text NOT NULL,
	`last_activity` int NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`submission_id` int unsigned NOT NULL,
	`problem_id` int unsigned NOT NULL,
	`submission_link` text NOT NULL,
	`submission_proof_link` text,
	`feedback` json,
	`data` json,
	`score` tinyint unsigned NOT NULL DEFAULT 0,
	`started_at` datetime,
	`submitted_at` datetime,
	`status` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `solutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendances` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`lecture_id` int unsigned NOT NULL,
	`schedule` datetime NOT NULL,
	`section_id` int unsigned NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`live_percentage` tinyint NOT NULL DEFAULT 0,
	`live_attendance_status` tinyint NOT NULL DEFAULT 0,
	`joined_late` tinyint NOT NULL DEFAULT 0,
	`late_by_minutes` int unsigned,
	`video_percentage` tinyint NOT NULL DEFAULT 0,
	`video_attendance_status` tinyint NOT NULL DEFAULT 0,
	`video_last_updated_at` timestamp,
	`include_video_attendance` tinyint NOT NULL DEFAULT 0,
	`catch_up_days` int unsigned,
	`status` tinyint NOT NULL DEFAULT 0,
	`meta` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `student_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_attendances_lecture_id_user_id_unique` UNIQUE(`lecture_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`assignment_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`score` double NOT NULL,
	`started_at` timestamp,
	`completed_at` timestamp,
	`data` json,
	`problems` json,
	`started` tinyint NOT NULL DEFAULT 0,
	`completed` tinyint NOT NULL DEFAULT 0,
	`status` varchar(255),
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`mark_as_completed` tinyint,
	`old_score` double NOT NULL,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`discussion_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`status` varchar(255),
	`public` tinyint NOT NULL DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`read_at` timestamp,
	CONSTRAINT `threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`status` varchar(255),
	`department` varchar(255),
	`priority` varchar(255),
	`is_closed` tinyint NOT NULL DEFAULT 0,
	`assignee_id` bigint unsigned NOT NULL,
	`closed_at` datetime,
	`meta` json,
	`deleted_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	`category` varchar(255) NOT NULL,
	`agent_id` bigint unsigned,
	`rating` int unsigned NOT NULL DEFAULT 0,
	`info` json,
	`logstamps` json,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`badge_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`badge_config_id` int unsigned NOT NULL,
	`badge_config_snapshot` json,
	`created_by` bigint unsigned,
	`release_date` date,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_badges_user_badge_config_unique` UNIQUE(`user_id`,`badge_id`,`badge_config_id`)
);
--> statement-breakpoint
CREATE TABLE `user_batch_admission_data` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`batch_id` int unsigned NOT NULL,
	`id_card_url` varchar(500),
	`seat_blocking_fees_paid` tinyint NOT NULL DEFAULT 0,
	`seat_blocking_fees_amount` decimal(10,2),
	`seat_blocking_fees_paid_date` datetime,
	`seat_blocking_fees_invoice` varchar(500),
	`full_fees_paid` tinyint NOT NULL DEFAULT 0,
	`full_fees_amount` decimal(10,2),
	`full_fees_paid_date` datetime,
	`full_fees_paid_invoice` varchar(500),
	`student_kit_exists` tinyint NOT NULL DEFAULT 0,
	`student_kit_details_filled` tinyint NOT NULL DEFAULT 0,
	`student_kit_tracking_url` varchar(500),
	`course_fee_deadline` datetime,
	`lms_access_date` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	`payment_url` varchar(500),
	`meta` json,
	CONSTRAINT `user_batch_admission_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_batch_admission_data_user_id_batch_id_unique` UNIQUE(`user_id`,`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `user_callback_tickets` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`resolved_by` bigint unsigned,
	`batch_id` int unsigned NOT NULL,
	`category` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL DEFAULT 'pending',
	`meta` json,
	`assigned_to` bigint unsigned,
	`preferred_time_slot` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	`admin_comment` text,
	`comment_updated_at` timestamp,
	`logs` json,
	`resolved_at` timestamp,
	CONSTRAINT `user_callback_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_device_tokens` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token` varchar(255) NOT NULL,
	`device_type` varchar(50),
	`device_name` varchar(255),
	`active` tinyint NOT NULL DEFAULT 1,
	`last_used` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `user_device_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_device_tokens_user_id_token_unique` UNIQUE(`user_id`,`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified_at` timestamp,
	`password` varchar(255) NOT NULL,
	`two_factor_secret` text,
	`two_factor_recovery_codes` text,
	`remember_token` varchar(100),
	`current_team_id` bigint unsigned,
	`profile_photo_path` varchar(2048),
	`created_at` timestamp,
	`updated_at` timestamp,
	`role` varchar(255),
	`mobile` varchar(255),
	`title` varchar(255),
	`status` varchar(255),
	`username` varchar(255),
	`last_active_at` timestamp,
	`status_time` datetime,
	`meta` json,
	`client` varchar(20) NOT NULL DEFAULT 'masai',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_client_unique` UNIQUE(`email`,`client`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `video_attendances` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`host_id` bigint unsigned NOT NULL,
	`category` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`batch_id` int NOT NULL,
	`section_id` int NOT NULL,
	`type` varchar(255) NOT NULL,
	`status` int NOT NULL,
	`schedule` datetime NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`intervals` json,
	`totalDuration` int,
	`data` json,
	`sessionToken` varchar(191),
	CONSTRAINT `video_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`post_id` bigint unsigned,
	`reply_id` bigint unsigned,
	`vote` enum('upvote','downvote') NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`vote_target` varchar(73) NOT NULL DEFAULT ((case when (`post_id` is not null) then concat(_utf8mb4'p:',`post_id`) else concat(_utf8mb4'r:',`reply_id`) end)),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `votes_user_id_vote_target_unique` UNIQUE(`user_id`,`vote_target`)
);
--> statement-breakpoint
CREATE TABLE `whatsnew` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`image` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `whatsnew_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` ADD CONSTRAINT `ai_chat_practice_questions_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` ADD CONSTRAINT `ai_chat_practice_questions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` ADD CONSTRAINT `ai_tutor_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ai_tutor_sessions` ADD CONSTRAINT `ai_tutor_sessions_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `announcement_reads` ADD CONSTRAINT `announcement_reads_announcement_id_announcements_id_fk` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcement_reads` ADD CONSTRAINT `announcement_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_form` ADD CONSTRAINT `assess_nps_form_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_form` ADD CONSTRAINT `assess_nps_form_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_form` ADD CONSTRAINT `assess_nps_form_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_submissions` ADD CONSTRAINT `assess_nps_submissions_nps_form_id_assess_nps_form_id_fk` FOREIGN KEY (`nps_form_id`) REFERENCES `assess_nps_form`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_submissions` ADD CONSTRAINT `assess_nps_submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_submissions` ADD CONSTRAINT `assess_nps_submissions_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assess_nps_submissions` ADD CONSTRAINT `assess_nps_submissions_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_problem` ADD CONSTRAINT `assignment_problem_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignment_problem` ADD CONSTRAINT `assignment_problem_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `badge_configs` ADD CONSTRAINT `badge_configs_badge_id_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `badge_configs` ADD CONSTRAINT `badge_configs_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `badge_configs` ADD CONSTRAINT `badge_configs_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_user` ADD CONSTRAINT `batch_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_user` ADD CONSTRAINT `batch_user_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubs` ADD CONSTRAINT `clubs_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_enrollments` ADD CONSTRAINT `event_enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_enrollments` ADD CONSTRAINT `event_enrollments_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_feedback_blueprint_id_feedback_blueprints_id_fk` FOREIGN KEY (`feedback_blueprint_id`) REFERENCES `feedback_blueprints`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `help_faqs` ADD CONSTRAINT `help_faqs_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_feedback` ADD CONSTRAINT `lecture_feedback_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_feedback` ADD CONSTRAINT `lecture_feedback_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_zoom_chat` ADD CONSTRAINT `lecture_zoom_chat_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lecture_zoom_chat` ADD CONSTRAINT `lecture_zoom_chat_last_edited_by_users_id_fk` FOREIGN KEY (`last_edited_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_feedback_id_feedback_id_fk` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures` ADD CONSTRAINT `lectures_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lectures_ai` ADD CONSTRAINT `lectures_ai_lectureId_lectures_id_fk` FOREIGN KEY (`lectureId`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `masaiverse_banners` ADD CONSTRAINT `masaiverse_banners_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_banners` ADD CONSTRAINT `masaiverse_banners_last_edited_by_users_id_fk` FOREIGN KEY (`last_edited_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_reply_id_replies_id_fk` FOREIGN KEY (`reply_id`) REFERENCES `replies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masaiverse_leaderboard` ADD CONSTRAINT `masaiverse_leaderboard_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `opt_in_choices` ADD CONSTRAINT `opt_in_choices_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_banned_by_users_id_fk` FOREIGN KEY (`banned_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `problems` ADD CONSTRAINT `problems_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replies` ADD CONSTRAINT `replies_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `replies` ADD CONSTRAINT `replies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_manager_id_users_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `section_user` ADD CONSTRAINT `section_user_opt_in_choice_id_opt_in_choices_id_fk` FOREIGN KEY (`opt_in_choice_id`) REFERENCES `opt_in_choices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sections` ADD CONSTRAINT `sections_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sections` ADD CONSTRAINT `sections_block_id_blocks_id_fk` FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solutions` ADD CONSTRAINT `solutions_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `solutions` ADD CONSTRAINT `solutions_problem_id_problems_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `threads` ADD CONSTRAINT `threads_discussion_id_discussions_id_fk` FOREIGN KEY (`discussion_id`) REFERENCES `discussions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `threads` ADD CONSTRAINT `threads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_agent_id_users_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_badge_id_badges_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_badge_config_id_badge_configs_id_fk` FOREIGN KEY (`badge_config_id`) REFERENCES `badge_configs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_batch_admission_data` ADD CONSTRAINT `user_batch_admission_data_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_batch_admission_data` ADD CONSTRAINT `user_batch_admission_data_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_callback_tickets` ADD CONSTRAINT `user_callback_tickets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_callback_tickets` ADD CONSTRAINT `user_callback_tickets_resolved_by_users_id_fk` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_callback_tickets` ADD CONSTRAINT `user_callback_tickets_batch_id_batches_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_callback_tickets` ADD CONSTRAINT `user_callback_tickets_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_device_tokens` ADD CONSTRAINT `user_device_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_attendances` ADD CONSTRAINT `video_attendances_host_id_users_id_fk` FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_reply_id_replies_id_fk` FOREIGN KEY (`reply_id`) REFERENCES `replies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_chat_practice_questions_created_at_idx` ON `ai_chat_practice_questions` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_tutor_sessions_created_at_index` ON `ai_tutor_sessions` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_tutor_sessions_lecture_id_index` ON `ai_tutor_sessions` (`lecture_id`);--> statement-breakpoint
CREATE INDEX `ai_tutor_sessions_unique_id_index` ON `ai_tutor_sessions` (`unique_id`);--> statement-breakpoint
CREATE INDEX `ai_tutor_sessions_user_id_index` ON `ai_tutor_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `announcement_reads_user_id_is_unread_index` ON `announcement_reads` (`user_id`,`is_unread`);--> statement-breakpoint
CREATE INDEX `attendances_batch_id_index` ON `attendances` (`batch_id`);--> statement-breakpoint
CREATE INDEX `attendances_lecture_id_index` ON `attendances` (`lecture_id`);--> statement-breakpoint
CREATE INDEX `attendances_section_id_index` ON `attendances` (`section_id`);--> statement-breakpoint
CREATE INDEX `attendances_user_id_index` ON `attendances` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_banners_group_name` ON `banners` (`group_name`);--> statement-breakpoint
CREATE INDEX `idx_banners_is_active` ON `banners` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_banners_type` ON `banners` (`type`);--> statement-breakpoint
CREATE INDEX `idx_banners_variant` ON `banners` (`variant`);--> statement-breakpoint
CREATE INDEX `idx_active` ON `batches` (`active`);--> statement-breakpoint
CREATE INDEX `idx_active_starting` ON `batches` (`active`,`starting`);--> statement-breakpoint
CREATE INDEX `idx_duration` ON `batches` (`duration`);--> statement-breakpoint
CREATE INDEX `idx_name` ON `batches` (`name`);--> statement-breakpoint
CREATE INDEX `idx_program` ON `batches` (`program`);--> statement-breakpoint
CREATE INDEX `idx_starting` ON `batches` (`starting`);--> statement-breakpoint
CREATE INDEX `idx_starting_active` ON `batches` (`starting`,`active`);--> statement-breakpoint
CREATE INDEX `bookmarks_entity_type_entity_id_index` ON `bookmarks` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `club_members_club_id_index` ON `club_members` (`club_id`);--> statement-breakpoint
CREATE INDEX `clubs_created_by_index` ON `clubs` (`created_by`);--> statement-breakpoint
CREATE INDEX `comments_created_at_index` ON `comments` (`created_at`);--> statement-breakpoint
CREATE INDEX `comments_updated_at_index` ON `comments` (`updated_at`);--> statement-breakpoint
CREATE INDEX `discussions_created_at_idx` ON `discussions` (`created_at`);--> statement-breakpoint
CREATE INDEX `discussions_entity_type_entity_id_index` ON `discussions` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `event_enrollments_event_id_index` ON `event_enrollments` (`event_id`);--> statement-breakpoint
CREATE INDEX `events_club_id_index` ON `events` (`club_id`);--> statement-breakpoint
CREATE INDEX `events_created_by_index` ON `events` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_name` ON `feedback` (`name`);--> statement-breakpoint
CREATE INDEX `help_faqs_category_index` ON `help_faqs` (`category`);--> statement-breakpoint
CREATE INDEX `help_faqs_category_sub_category_index` ON `help_faqs` (`category`,`sub_category`);--> statement-breakpoint
CREATE INDEX `help_faqs_is_hidden_index` ON `help_faqs` (`is_hidden`);--> statement-breakpoint
CREATE INDEX `help_faqs_sub_category_index` ON `help_faqs` (`sub_category`);--> statement-breakpoint
CREATE INDEX `lecture_feedback_lecture_id_foreign` ON `lecture_feedback` (`lecture_id`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `lectures` (`category`);--> statement-breakpoint
CREATE INDEX `idx_concludes` ON `lectures` (`concludes`);--> statement-breakpoint
CREATE INDEX `idx_schedule` ON `lectures` (`schedule`);--> statement-breakpoint
CREATE INDEX `idx_title` ON `lectures` (`title`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `lectures` (`type`);--> statement-breakpoint
CREATE INDEX `idx_updated_at` ON `lectures` (`updated_at`);--> statement-breakpoint
CREATE INDEX `login_attempts_attempted_at_idx` ON `login_attempts` (`attempted_at`);--> statement-breakpoint
CREATE INDEX `login_attempts_identifier_idx` ON `login_attempts` (`identifier`);--> statement-breakpoint
CREATE INDEX `login_attempts_ip_address_idx` ON `login_attempts` (`ip_address`);--> statement-breakpoint
CREATE INDEX `masaiverse_banners_created_by_index` ON `masaiverse_banners` (`created_by`);--> statement-breakpoint
CREATE INDEX `masaiverse_banners_last_edited_by_index` ON `masaiverse_banners` (`last_edited_by`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_club_id_index` ON `masaiverse_leaderboard` (`club_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_created_by_index` ON `masaiverse_leaderboard` (`created_by`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_event_id_index` ON `masaiverse_leaderboard` (`event_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_post_id_index` ON `masaiverse_leaderboard` (`post_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_reason_index` ON `masaiverse_leaderboard` (`reason`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_reply_id_index` ON `masaiverse_leaderboard` (`reply_id`);--> statement-breakpoint
CREATE INDEX `masaiverse_leaderboard_user_id_index` ON `masaiverse_leaderboard` (`user_id`);--> statement-breakpoint
CREATE INDEX `messages_created_at_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `notification_logs_entity_index` ON `notification_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `notification_logs_sent_at_index` ON `notification_logs` (`sent_at`);--> statement-breakpoint
CREATE INDEX `notification_logs_status_index` ON `notification_logs` (`status`);--> statement-breakpoint
CREATE INDEX `notification_logs_type_index` ON `notification_logs` (`notification_type`);--> statement-breakpoint
CREATE INDEX `notification_logs_user_id_index` ON `notification_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `otp_codes_identifier_idx` ON `otp_codes` (`identifier`);--> statement-breakpoint
CREATE INDEX `posts_banned_by_index` ON `posts` (`banned_by`);--> statement-breakpoint
CREATE INDEX `posts_club_id_index` ON `posts` (`club_id`);--> statement-breakpoint
CREATE INDEX `posts_user_id_index` ON `posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `replies_post_id_index` ON `replies` (`post_id`);--> statement-breakpoint
CREATE INDEX `replies_user_id_index` ON `replies` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_role` ON `section_user` (`role`);--> statement-breakpoint
CREATE INDEX `idx_name` ON `sections` (`name`);--> statement-breakpoint
CREATE INDEX `sessions_last_activity_index` ON `sessions` (`last_activity`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `student_attendances_batch_id_index` ON `student_attendances` (`batch_id`);--> statement-breakpoint
CREATE INDEX `student_attendances_lecture_id_index` ON `student_attendances` (`lecture_id`);--> statement-breakpoint
CREATE INDEX `student_attendances_schedule_index` ON `student_attendances` (`schedule`);--> statement-breakpoint
CREATE INDEX `student_attendances_section_id_schedule_index` ON `student_attendances` (`section_id`,`schedule`);--> statement-breakpoint
CREATE INDEX `student_attendances_status_index` ON `student_attendances` (`status`);--> statement-breakpoint
CREATE INDEX `student_attendances_user_id_schedule_index` ON `student_attendances` (`user_id`,`schedule`);--> statement-breakpoint
CREATE INDEX `tickets_closed_at_index` ON `tickets` (`closed_at`);--> statement-breakpoint
CREATE INDEX `tickets_created_at_index` ON `tickets` (`created_at`);--> statement-breakpoint
CREATE INDEX `tickets_updated_at_index` ON `tickets` (`updated_at`);--> statement-breakpoint
CREATE INDEX `user_batch_admission_data_batch_id_index` ON `user_batch_admission_data` (`batch_id`);--> statement-breakpoint
CREATE INDEX `user_batch_admission_data_user_id_index` ON `user_batch_admission_data` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_callback_tickets_status_index` ON `user_callback_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_active_index` ON `user_device_tokens` (`active`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_token_index` ON `user_device_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `user_device_tokens_user_id_index` ON `user_device_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_name` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `idx_video_att_batch_lecture` ON `video_attendances` (`batch_id`,`lecture_id`);--> statement-breakpoint
CREATE INDEX `idx_video_att_created` ON `video_attendances` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_video_att_user_lecture` ON `video_attendances` (`user_id`,`lecture_id`);--> statement-breakpoint
CREATE INDEX `votes_post_id_index` ON `votes` (`post_id`);--> statement-breakpoint
CREATE INDEX `votes_reply_id_index` ON `votes` (`reply_id`);