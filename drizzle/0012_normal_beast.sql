ALTER TABLE `flashcard` ADD `metadata` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
UPDATE `flashcard` 
SET `definition` = '---\ntitle: "' || replace(`term`, '"', '\"') || '"\ntags: ' || `tags` || '\n---\n\n' || `definition`
WHERE `type` = 'note' AND `definition` NOT LIKE '---%';