import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import matter from 'gray-matter';
import { APP_CONFIG } from '$lib/config';

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
		const definition = formData.get('definition')?.toString();

		if (!definition) {
			return fail(400, { message: 'Content is required' });
		}

		const parsed = matter(definition);

		let term = parsed.data.title;
		if (!term) {
			const h1Match = parsed.content.match(/^#\s+(.+)$/m);
			if (h1Match) term = h1Match[1].trim();
		}

		if (!term) {
			term = 'Untitled Note';
		}

		let tags: string[] = [];
		if (Array.isArray(parsed.data.tags)) {
			tags = parsed.data.tags.map(String);
		} else if (typeof parsed.data.tags === 'string') {
			tags = parsed.data.tags.split(',').map((s: string) => s.trim());
		}

		const { title: _title, tags: _tags, ...metadata } = parsed.data;

		// Validation rules for tags
		if (tags.length > 20) return fail(400, { message: 'Maximum 20 tags allowed' });
		tags = tags.map((t) => t.replace(/\s+/g, ' ').trim().toLowerCase());
		if (tags.some((t) => t.length > 16))
			return fail(400, { message: 'Tag cannot exceed 16 characters' });
		if (tags.some((t) => !/^[a-z0-9. ]+$/.test(t)))
			return fail(400, {
				message: 'Tags can only contain lowercase letters, numbers, dots, and spaces'
			});
		tags = Array.from(new Set(tags));

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Verify ownership
		const cols = await db
			.select()
			.from(collection)
			.where(and(eq(collection.id, id), eq(collection.userId, user.id)));

		if (cols.length === 0) return fail(403, { message: 'Forbidden' });

		if (user.type === 'BASIC') {
			const countResult = await db
				.select({ value: count() })
				.from(flashcard)
				.where(eq(flashcard.collectionId, id));
			if (countResult[0].value >= APP_CONFIG.limits.basic.itemsPerCollection) {
				return fail(403, {
					limitReached: true,
					limitMessage: `BASIC users can only have up to ${APP_CONFIG.limits.basic.itemsPerCollection} items (cards + notes) per collection.`
				});
			}
		}

		try {
			await db.insert(flashcard).values({
				collectionId: id,
				term: term.trim(),
				definition: definition.trim(),
				type: 'note',
				tags,
				metadata
			});
		} catch (e) {
			return fail(500, { message: 'Failed to save note' });
		}

		throw redirect(302, `/collections/${id}`);
	}
};
