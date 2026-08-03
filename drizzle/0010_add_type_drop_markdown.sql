-- Custom SQL migration file, put your code below! --
ALTER TABLE flashcard ADD COLUMN type text not null default 'flashcard';
ALTER TABLE flashcard DROP COLUMN is_markdown;