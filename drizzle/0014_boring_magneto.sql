CREATE TABLE `flashcard_tag` (
	`flashcard_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`flashcard_id`, `tag_id`),
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcard`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);
--> statement-breakpoint

-- MIGRATION OF TAGS --
INSERT INTO tag (id, name) 
SELECT lower(hex(randomblob(16))), json_each.value 
FROM flashcard, json_each(flashcard.tags) 
GROUP BY json_each.value;
--> statement-breakpoint
INSERT INTO flashcard_tag (flashcard_id, tag_id) 
SELECT flashcard.id, tag.id 
FROM flashcard, json_each(flashcard.tags) 
JOIN tag ON tag.name = json_each.value;
--> statement-breakpoint

-- DROP TRIGGERS THAT USE tags --
DROP TRIGGER IF EXISTS flashcard_ad;
--> statement-breakpoint
DROP TRIGGER IF EXISTS flashcard_au;
--> statement-breakpoint
DROP TRIGGER IF EXISTS flashcard_ai;
--> statement-breakpoint

ALTER TABLE `flashcard` DROP COLUMN `tags`;
--> statement-breakpoint

-- RECREATE TRIGGERS WITHOUT tags --
CREATE TRIGGER flashcard_ad AFTER DELETE ON flashcard
BEGIN
  DELETE FROM flashcard_fts WHERE rowid = old.rowid;
END;
--> statement-breakpoint
CREATE TRIGGER flashcard_au AFTER UPDATE ON flashcard
BEGIN
  DELETE FROM flashcard_fts WHERE rowid = old.rowid;
  INSERT INTO flashcard_fts(rowid, id, term, definition)
  VALUES (new.rowid, new.id, new.term, new.definition);
END;
--> statement-breakpoint
CREATE TRIGGER flashcard_ai AFTER INSERT ON flashcard
BEGIN
  INSERT INTO flashcard_fts(rowid, id, term, definition)
  VALUES (new.rowid, new.id, new.term, new.definition);
END;