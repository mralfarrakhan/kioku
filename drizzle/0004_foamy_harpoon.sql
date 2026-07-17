ALTER TABLE `user_flashcard_progress` ADD `ease_factor` real DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_flashcard_progress` ADD `interval` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_flashcard_progress` ADD `repetitions` integer DEFAULT 0 NOT NULL;