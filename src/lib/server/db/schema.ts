import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import { sql } from 'drizzle-orm';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const collection = sqliteTable('collection', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => new Date())
		.notNull()
});

export const flashcard = sqliteTable('flashcard', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	collectionId: text('collection_id')
		.notNull()
		.references(() => collection.id, { onDelete: 'cascade' }),
	term: text('term').notNull(),
	definition: text('definition').notNull(),
	isMarkdown: integer('is_markdown', { mode: 'boolean' }).notNull().default(false),
	tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => new Date())
		.notNull()
});

export const flashcardFts = sqliteTable('flashcard_fts', {
	rowid: integer('rowid').primaryKey(),
	id: text('id').notNull(),
	term: text('term'),
	definition: text('definition'),
	tags: text('tags'),
	rank: real('rank')
});

export const userFlashcardProgress = sqliteTable('user_flashcard_progress', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	flashcardId: text('flashcard_id')
		.notNull()
		.references(() => flashcard.id, { onDelete: 'cascade' }),
	fluencyScore: integer('fluency_score').notNull().default(0), // Kept for backwards compatibility
	easeFactor: real('ease_factor').notNull().default(2.5),
	interval: real('interval').notNull().default(0), // interval in days
	repetitions: integer('repetitions').notNull().default(0),
	lastReviewedAt: integer('last_reviewed_at', { mode: 'timestamp_ms' }),
	nextReviewAt: integer('next_review_at', { mode: 'timestamp_ms' }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => new Date())
		.notNull()
});

export * from './auth.schema';
