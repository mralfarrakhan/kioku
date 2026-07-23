import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, userFlashcardProgress, flashcardFts } from '$lib/server/db/schema';
import { eq, and, desc, count, asc, sql, or } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const id = event.params.id;
	const db = getDb(event.platform?.env?.DB as D1Database);

	const collections = await db.select().from(collection).where(eq(collection.id, id));

	if (collections.length === 0) {
		return redirect(302, '/');
	}

	const coll = collections[0];

	// Ensure the user has access (either owns it or it's shared)
	if (coll.userId !== event.locals.user.id && !coll.isShared) {
		return redirect(302, '/');
	}

	// Search & Pagination parameters
	const page = parseInt(event.url.searchParams.get('page') || '1') || 1;
	const pageSize = 20;
	const q = event.url.searchParams.get('q')?.trim();
	const tagsParam = event.url.searchParams.get('tags');
	const sort = event.url.searchParams.get('sort') || 'newest';
	const status = event.url.searchParams.get('status');
	const difficulty = event.url.searchParams.get('difficulty');

	const conditions = [eq(flashcard.collectionId, id)];

	if (tagsParam) {
		const tagsList = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
		if (tagsList.length > 0) {
			const tagConditions = tagsList.map(tag => sql`EXISTS (SELECT 1 FROM json_each(${flashcard.tags}) WHERE value = ${tag})`);
			conditions.push(and(...tagConditions)!);
		}
	}

	if (status) {
		const now = Date.now();
		if (status === 'new') {
			conditions.push(or(eq(userFlashcardProgress.repetitions, 0), sql`${userFlashcardProgress.id} IS NULL`)!);
		} else if (status === 'learning') {
			conditions.push(and(sql`${userFlashcardProgress.id} IS NOT NULL`, sql`${userFlashcardProgress.repetitions} > 0`, sql`${userFlashcardProgress.interval} < 21`)!);
		} else if (status === 'due') {
			conditions.push(and(sql`${userFlashcardProgress.id} IS NOT NULL`, sql`${userFlashcardProgress.nextReviewAt} <= ${now}`)!);
		}
	}

	if (difficulty) {
		if (difficulty === 'hard') {
			conditions.push(sql`${userFlashcardProgress.easeFactor} < 2.0`);
		} else if (difficulty === 'medium') {
			conditions.push(and(sql`${userFlashcardProgress.easeFactor} >= 2.0`, sql`${userFlashcardProgress.easeFactor} <= 2.5`)!);
		} else if (difficulty === 'easy') {
			conditions.push(sql`${userFlashcardProgress.easeFactor} > 2.5`);
		}
	}

	let baseQuery = db
		.select({
			id: flashcard.id,
			term: flashcard.term,
			definition: flashcard.definition,
			isMarkdown: flashcard.isMarkdown,
			tags: flashcard.tags,
			collectionId: flashcard.collectionId,
			createdAt: flashcard.createdAt,
			updatedAt: flashcard.updatedAt,
			fluencyScore: userFlashcardProgress.fluencyScore,
			easeFactor: userFlashcardProgress.easeFactor,
			nextReviewAt: userFlashcardProgress.nextReviewAt,
			interval: userFlashcardProgress.interval,
			repetitions: userFlashcardProgress.repetitions
		})
		.from(flashcard)
		.leftJoin(
			userFlashcardProgress,
			and(
				eq(flashcard.id, userFlashcardProgress.flashcardId),
				eq(userFlashcardProgress.userId, event.locals.user.id)
			)
		);

	let countQuery = db
		.select({ value: count() })
		.from(flashcard)
		.leftJoin(
			userFlashcardProgress,
			and(
				eq(flashcard.id, userFlashcardProgress.flashcardId),
				eq(userFlashcardProgress.userId, event.locals.user.id)
			)
		);

	if (q) {
		const ftsQuery = q.replace(/"/g, '""');
		// FTS5 MATCH operator format for trigram/unicode61
		// By wrapping with quotes it escapes some keywords, but FTS5 query syntax is strict.
		// A simple query parameterization string:
		const matchQuery = `"${ftsQuery}"*`; 
		
		baseQuery = baseQuery.innerJoin(
			flashcardFts,
			and(
				eq(flashcard.id, flashcardFts.id),
				sql`flashcard_fts MATCH ${matchQuery}`
			)
		) as any;
		
		countQuery = countQuery.innerJoin(
			flashcardFts,
			and(
				eq(flashcard.id, flashcardFts.id),
				sql`flashcard_fts MATCH ${matchQuery}`
			)
		) as any;
	}

	let orderClause = desc(flashcard.createdAt);
	if (sort === 'oldest') orderClause = asc(flashcard.createdAt);
	else if (sort === 'a-z') orderClause = asc(flashcard.term);
	else if (sort === 'z-a') orderClause = desc(flashcard.term);
	else if (sort === 'relevance' && q) orderClause = asc(sql`rank`);

	const countResult = await countQuery.where(and(...conditions));
	const totalItems = countResult[0].value;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	const flashcards = await baseQuery
		.where(and(...conditions))
		.orderBy(orderClause)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const d1 = event.platform?.env?.DB as D1Database | undefined;
	let allUniqueTags: string[] = [];

	if (d1) {
		const result = await d1
			.prepare(
				`SELECT DISTINCT json_each.value as tag FROM flashcard, json_each(flashcard.tags) WHERE flashcard.collection_id = ?`
			)
			.bind(id)
			.all<{ tag: string }>();
		allUniqueTags = result.results.map((r) => r.tag).filter(Boolean);
	} else {
		// Fallback for environment without D1 bound (e.g. some dev setups)
		const allTagsResult = await db
			.select({ tags: flashcard.tags })
			.from(flashcard)
			.where(eq(flashcard.collectionId, id));

		allUniqueTags = Array.from(new Set(allTagsResult.flatMap((c) => c.tags || [])));
	}

	return {
		collection: coll,
		flashcards,
		allUniqueTags,
		pagination: {
			page,
			totalPages,
			totalItems
		}
	};
};

export const actions: Actions = {
	editCollection: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const id = event.params.id;
		const formData = await event.request.formData();
		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString();
		const isShared = formData.get('isShared')?.toString() === 'on';

		if (!title) return fail(400, { message: 'Title is required' });

		const db = getDb(event.platform?.env?.DB as D1Database);

		try {
			await db
				.update(collection)
				.set({ title, description, isShared })
				.where(and(eq(collection.id, id), eq(collection.userId, user.id)));
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to update collection' });
		}
	},

	createFlashcard: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const id = event.params.id;
		const formData = await event.request.formData();
		const term = formData.get('term')?.toString();
		const definition = formData.get('definition')?.toString();
		const isMarkdown = formData.get('isMarkdown')?.toString() === 'on';
		
		let tags: string[] = [];
		try {
			const parsed = JSON.parse(formData.get('tags')?.toString() || '[]');
			if (Array.isArray(parsed)) {
				tags = parsed;
			} else {
				return fail(400, { message: 'Tags must be an array' });
			}
		} catch (e) {
			return fail(400, { message: 'Invalid tags format' });
		}

		// Validation rules for tags
		if (tags.length > 20) return fail(400, { message: 'Maximum 20 tags allowed' });
		tags = tags.map((t) => t.trim().toLowerCase());
		if (tags.some((t) => t.length > 16))
			return fail(400, { message: 'Tag cannot exceed 16 characters' });
		if (tags.some((t) => !/^[a-z]+$/.test(t)))
			return fail(400, { message: 'Tags can only contain alphabetic characters' });
		tags = Array.from(new Set(tags));

		if (!term || !definition) {
			return fail(400, { message: 'Term and definition are required' });
		}

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, id), eq(collection.userId, user.id)));
		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		// Check for duplicate terms
		const existingCards = await db
			.select({ term: flashcard.term })
			.from(flashcard)
			.where(eq(flashcard.collectionId, id));

		const isDuplicate = existingCards.some(
			(card) => card.term.trim().toLowerCase() === term.trim().toLowerCase()
		);

		if (isDuplicate) {
			return fail(400, {
				message: 'A flashcard with this term already exists in this collection.'
			});
		}

		try {
			await db.insert(flashcard).values({
				collectionId: id,
				term: term.trim(),
				definition: definition.trim(),
				isMarkdown,
				tags
			});
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to create flashcard' });
		}
	},

	editFlashcard: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const collectionId = event.params.id;
		const formData = await event.request.formData();
		const flashcardId = formData.get('id')?.toString();
		const term = formData.get('term')?.toString();
		const definition = formData.get('definition')?.toString();
		const isMarkdown = formData.get('isMarkdown')?.toString() === 'on';

		let tags: string[] = [];
		try {
			const parsed = JSON.parse(formData.get('tags')?.toString() || '[]');
			if (Array.isArray(parsed)) {
				tags = parsed;
			} else {
				return fail(400, { message: 'Tags must be an array' });
			}
		} catch (e) {
			return fail(400, { message: 'Invalid tags format' });
		}

		// Validation rules for tags
		if (tags.length > 20) return fail(400, { message: 'Maximum 20 tags allowed' });
		tags = tags.map((t) => t.trim().toLowerCase());
		if (tags.some((t) => t.length > 16))
			return fail(400, { message: 'Tag cannot exceed 16 characters' });
		if (tags.some((t) => !/^[a-z]+$/.test(t)))
			return fail(400, { message: 'Tags can only contain alphabetic characters' });
		tags = Array.from(new Set(tags));

		if (!flashcardId || !term || !definition) return fail(400, { message: 'Missing fields' });

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership of the collection
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, collectionId), eq(collection.userId, user.id)));
		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		// Check for duplicate terms (excluding the current card being edited)
		const existingCards = await db
			.select({ id: flashcard.id, term: flashcard.term })
			.from(flashcard)
			.where(eq(flashcard.collectionId, collectionId));

		const isDuplicate = existingCards.some(
			(card) => card.id !== flashcardId && card.term.trim().toLowerCase() === term.trim().toLowerCase()
		);

		if (isDuplicate) {
			return fail(400, {
				message: 'A flashcard with this term already exists in this collection.'
			});
		}

		try {
			await db
				.update(flashcard)
				.set({ term, definition, isMarkdown, tags })
				.where(and(eq(flashcard.id, flashcardId), eq(flashcard.collectionId, collectionId)));
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to update flashcard' });
		}
	},

	deleteFlashcard: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const collectionId = event.params.id;
		const formData = await event.request.formData();
		const flashcardId = formData.get('id')?.toString();

		if (!flashcardId) return fail(400, { message: 'Missing ID' });

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership of the collection
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, collectionId), eq(collection.userId, user.id)));
		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		try {
			await db
				.delete(flashcard)
				.where(and(eq(flashcard.id, flashcardId), eq(flashcard.collectionId, collectionId)));
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to delete flashcard' });
		}
	}
};
