-- interview_sessions exists on dev DBs (created before migration tracking) but
-- not on prod, so this is written as one idempotent CREATE TABLE IF NOT EXISTS
-- with the index and FK inline: no-op where it exists, full create where not.
-- Names match the constraint/index names already live on dev.
CREATE TABLE IF NOT EXISTS `interview_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`topic_id` varchar(191) NOT NULL,
	`topic_label` varchar(255) NOT NULL,
	`domain` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'in_progress',
	`num_questions` int NOT NULL DEFAULT 5,
	`language` varchar(20) NOT NULL DEFAULT 'English',
	`turns` json NOT NULL,
	`report` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`),
	INDEX `idx_interview_sessions_user_id` (`user_id`),
	CONSTRAINT `interview_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);
