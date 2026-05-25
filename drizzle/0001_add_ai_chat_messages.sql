CREATE TABLE `ai_chat_messages` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`lecture_id` int unsigned NOT NULL,
	`role` varchar(16) NOT NULL,
	`source` varchar(16) NOT NULL DEFAULT 'text',
	`content` longtext NOT NULL,
	`session_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ai_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_chat_messages_lecture_user_created_idx` ON `ai_chat_messages` (`lecture_id`,`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `ai_chat_messages_session_id_idx` ON `ai_chat_messages` (`session_id`);
--> statement-breakpoint
ALTER TABLE `ai_chat_messages` ADD CONSTRAINT `ai_chat_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE `ai_chat_messages` ADD CONSTRAINT `ai_chat_messages_lecture_id_lectures_id_fk` FOREIGN KEY (`lecture_id`) REFERENCES `lectures`(`id`) ON DELETE restrict ON UPDATE cascade;
