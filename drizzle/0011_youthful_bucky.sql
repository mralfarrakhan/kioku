PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_collection` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_shared` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_collection`("id", "user_id", "title", "description", "is_shared", "created_at", "updated_at") SELECT "id", "user_id", "title", "description", "is_shared", "created_at", "updated_at" FROM `collection`;--> statement-breakpoint
DROP TABLE `collection`;--> statement-breakpoint
ALTER TABLE `__new_collection` RENAME TO `collection`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `user` ADD `type` text DEFAULT 'BASIC' NOT NULL;