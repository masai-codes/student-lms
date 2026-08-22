ALTER TABLE `ai_chat_practice_questions` ADD `started_from` varchar(50);--> statement-breakpoint
ALTER TABLE `ai_chat_practice_questions` ADD `rated_from` varchar(50);--> statement-breakpoint
CREATE INDEX `ai_chat_practice_questions_started_from_idx` ON `ai_chat_practice_questions` (`started_from`);--> statement-breakpoint
CREATE INDEX `ai_chat_practice_questions_rated_from_idx` ON `ai_chat_practice_questions` (`rated_from`);
