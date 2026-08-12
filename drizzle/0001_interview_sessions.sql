CREATE TABLE `interview_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`topic_id` varchar(191) NOT NULL,
	`topic_label` varchar(255) NOT NULL,
	`domain` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'in_progress',
	`turns` json NOT NULL,
	`report` json,
	`created_at` timestamp,
	`updated_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `interview_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `interview_sessions` ADD CONSTRAINT `interview_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_interview_sessions_user_id` ON `interview_sessions` (`user_id`);