CREATE INDEX `collection_user_id_idx` ON `collection` (`user_id`);--> statement-breakpoint
CREATE INDEX `flashcard_collection_id_idx` ON `flashcard` (`collection_id`);--> statement-breakpoint
CREATE INDEX `flashcard_collection_type_idx` ON `flashcard` (`collection_id`,`type`);--> statement-breakpoint
CREATE INDEX `flashcard_tag_tag_id_idx` ON `flashcard_tag` (`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_progress_user_card_idx` ON `user_flashcard_progress` (`user_id`,`flashcard_id`);--> statement-breakpoint
CREATE INDEX `user_progress_next_review_at_idx` ON `user_flashcard_progress` (`next_review_at`);