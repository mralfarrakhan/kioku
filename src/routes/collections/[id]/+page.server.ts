import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, userFlashcardProgress } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

	const flashcards = await db
		.select({
			id: flashcard.id,
			term: flashcard.term,
			definition: flashcard.definition,
			collectionId: flashcard.collectionId,
			createdAt: flashcard.createdAt,
			updatedAt: flashcard.updatedAt,
			fluencyScore: userFlashcardProgress.fluencyScore
		})
		.from(flashcard)
		.leftJoin(
			userFlashcardProgress,
			and(
				eq(flashcard.id, userFlashcardProgress.flashcardId),
				eq(userFlashcardProgress.userId, event.locals.user.id)
			)
		)
		.where(eq(flashcard.collectionId, id))
		.orderBy(desc(flashcard.createdAt));

	return {
		collection: coll,
		flashcards
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

		try {
			await db.insert(flashcard).values({
				collectionId: id,
				term,
				definition
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

		if (!flashcardId || !term || !definition) return fail(400, { message: 'Missing fields' });

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership of the collection
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, collectionId), eq(collection.userId, user.id)));
		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		try {
			await db
				.update(flashcard)
				.set({ term, definition })
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
