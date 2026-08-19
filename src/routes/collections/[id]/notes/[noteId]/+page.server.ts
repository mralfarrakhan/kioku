import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, tag, flashcardTag } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import matter from 'gray-matter';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const { id, noteId } = event.params;
	const db = getDb(event.platform?.env?.DB as D1Database);

	const cols = await db.select().from(collection).where(eq(collection.id, id));

	if (cols.length === 0) {
		return redirect(302, '/');
	}

	const coll = cols[0];

	// Ensure the user has access (either owns it or it's shared)
	if (coll.userId !== event.locals.user.id && !coll.isShared) {
		return redirect(302, '/');
	}

	const notes = await db
		.select()
		.from(flashcard)
		.where(
			and(eq(flashcard.id, noteId), eq(flashcard.collectionId, id), eq(flashcard.type, 'note'))
		);

	if (notes.length === 0) {
		throw error(404, 'Note not found');
	}

	const note = notes[0];
	const parsed = matter(note.definition);

	const allTagsResult = await db
		.select({ name: tag.name })
		.from(tag)
		.innerJoin(flashcardTag, eq(tag.id, flashcardTag.tagId))
		.innerJoin(flashcard, eq(flashcardTag.flashcardId, flashcard.id))
		.where(eq(flashcard.collectionId, id));

	const allUniqueTags = Array.from(new Set(allTagsResult.map((t) => t.name)));

	return {
		collection: coll,
		note,
		cleanContent: parsed.content,
		allUniqueTags
	};
};

export const actions: Actions = {
	deleteNote: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const { id, noteId } = event.params;

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, id), eq(collection.userId, user.id)));

		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		try {
			await db
				.delete(flashcard)
				.where(and(eq(flashcard.id, noteId), eq(flashcard.collectionId, id)));
		} catch (e) {
			return fail(500, { message: 'Failed to delete note' });
		}

		throw redirect(302, `/collections/${id}`);
	}
};
