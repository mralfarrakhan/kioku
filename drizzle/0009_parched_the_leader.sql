ALTER TABLE `user` ADD `type` text DEFAULT 'FREE' NOT NULL;
--> statement-breakpoint
UPDATE `collection` SET `is_shared` = 1;