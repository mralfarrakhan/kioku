import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const id = event.params.id;
	const db = getDb(event.platform?.env?.DB as D1Database);

	const cols = await db.select().from(collection).where(eq(collection.id, id));

	if (cols.length === 0) {
		return redirect(302, '/');
	}

	const coll = cols[0];

	// Only owner can create notes
	if (coll.userId !== event.locals.user.id) {
		return redirect(302, `/collections/${id}`);
	}

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
		const allTagsResult = await db
			.select({ tags: flashcard.tags })
			.from(flashcard)
			.where(eq(flashcard.collectionId, id));
		allUniqueTags = Array.from(new Set(allTagsResult.flatMap((c) => c.tags || [])));
	}

	return {
		collection: coll,
		allUniqueTags
	};
};

export const actions: Actions = {
	createNote: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const id = event.params.id;
		const formData = await event.request.formData();
		const term = formData.get('term')?.toString();
		const definition = formData.get('definition')?.toString();

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
			return fail(400, { message: 'Title and content are required' });
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
				term: term.trim(),
				definition: definition.trim(),
				type: 'note',
				tags
			});
		} catch (e) {
			return fail(500, { message: 'Failed to save note' });
		}
		
		throw redirect(302, `/collections/${id}`);
	}
};
