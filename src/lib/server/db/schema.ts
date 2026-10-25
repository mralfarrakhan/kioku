import { integer, sqliteTable, text, real, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
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
	isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => new Date())
		.notNull()
}, (t) => ({
	userIdIdx: index('collection_user_id_idx').on(t.userId)
}));

export const flashcard = sqliteTable('flashcard', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	collectionId: text('collection_id')
		.notNull()
		.references(() => collection.id, { onDelete: 'cascade' }),
	term: text('term').notNull(),
	definition: text('definition').notNull(),
	type: text('type', { enum: ['flashcard', 'note'] })
		.notNull()
		.default('flashcard'),
	metadata: text('metadata', { mode: 'json' })
		.$type<Record<string, any>>()
		.notNull()
		.default(sql`'{}'`),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.$onUpdate(() => new Date())
		.notNull()
}, (t) => ({
	collectionIdIdx: index('flashcard_collection_id_idx').on(t.collectionId),
	collectionTypeIdx: index('flashcard_collection_type_idx').on(t.collectionId, t.type)
}));

export const tag = sqliteTable('tag', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull().unique(),
});

export const flashcardTag = sqliteTable(
	'flashcard_tag',
	{
		flashcardId: text('flashcard_id')
			.notNull()
			.references(() => flashcard.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(t) => {
		return {
			pk: primaryKey({ columns: [t.flashcardId, t.tagId] }),
			tagIdIdx: index('flashcard_tag_tag_id_idx').on(t.tagId)
		};
	}
);

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
		.notNull(),
	isIgnored: integer('is_ignored', { mode: 'boolean' }).notNull().default(false)
}, (t) => ({
	userFlashcardIdx: uniqueIndex('user_progress_user_card_idx').on(t.userId, t.flashcardId),
	nextReviewAtIdx: index('user_progress_next_review_at_idx').on(t.nextReviewAt)
}));

export * from './auth.schema';
