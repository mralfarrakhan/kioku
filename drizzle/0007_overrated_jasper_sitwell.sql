-- Custom SQL migration file for FTS5 --

CREATE VIRTUAL TABLE IF NOT EXISTS flashcard_fts USING fts5(
  id UNINDEXED,
  term,
  definition,
  tags,
  tokenize='unicode61'
);

-- Initialize FTS table with existing data
INSERT INTO flashcard_fts(rowid, id, term, definition, tags)
SELECT rowid, id, term, definition, tags FROM flashcard;

-- Insert Trigger
CREATE TRIGGER IF NOT EXISTS flashcard_ai AFTER INSERT ON flashcard
BEGIN
  INSERT INTO flashcard_fts(rowid, id, term, definition, tags)
  VALUES (new.rowid, new.id, new.term, new.definition, new.tags);
END;

-- Delete Trigger
CREATE TRIGGER IF NOT EXISTS flashcard_ad AFTER DELETE ON flashcard
BEGIN
  INSERT INTO flashcard_fts(flashcard_fts, rowid, id, term, definition, tags)
  VALUES ('delete', old.rowid, old.id, old.term, old.definition, old.tags);
END;

-- Update Trigger
CREATE TRIGGER IF NOT EXISTS flashcard_au AFTER UPDATE ON flashcard
BEGIN
  INSERT INTO flashcard_fts(flashcard_fts, rowid, id, term, definition, tags)
  VALUES ('delete', old.rowid, old.id, old.term, old.definition, old.tags);

  INSERT INTO flashcard_fts(rowid, id, term, definition, tags)
  VALUES (new.rowid, new.id, new.term, new.definition, new.tags);
END;