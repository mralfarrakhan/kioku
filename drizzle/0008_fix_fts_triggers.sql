-- Custom SQL migration to fix FTS5 triggers --

DROP TRIGGER IF EXISTS flashcard_ad;
DROP TRIGGER IF EXISTS flashcard_au;

-- Delete Trigger
CREATE TRIGGER flashcard_ad AFTER DELETE ON flashcard
BEGIN
  DELETE FROM flashcard_fts WHERE rowid = old.rowid;
END;

-- Update Trigger
CREATE TRIGGER flashcard_au AFTER UPDATE ON flashcard
BEGIN
  DELETE FROM flashcard_fts WHERE rowid = old.rowid;

  INSERT INTO flashcard_fts(rowid, id, term, definition, tags)
  VALUES (new.rowid, new.id, new.term, new.definition, new.tags);
END;
