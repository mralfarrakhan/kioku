ALTER TABLE `flashcard` ADD `type` text DEFAULT 'flashcard' NOT NULL;--> statement-breakpoint
UPDATE `flashcard` SET `type` = 'note' WHERE `is_markdown` = 1;--> statement-breakpoint
ALTER TABLE `flashcard` DROP COLUMN `is_markdown`;