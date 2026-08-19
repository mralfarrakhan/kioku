import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, tag, flashcardTag } from '$lib/server/db/schema';
import { eq, and, count, inArray } from 'drizzle-orm';
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

	const allTagsResult = await db
		.select({ name: tag.name })
		.from(tag)
		.innerJoin(flashcardTag, eq(tag.id, flashcardTag.tagId))
		.innerJoin(flashcard, eq(flashcardTag.flashcardId, flashcard.id))
		.where(eq(flashcard.collectionId, id));

	const allUniqueTags = Array.from(new Set(allTagsResult.map((t) => t.name)));

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

		if ((user as any).type === 'BASIC') {
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
			const result = await db.insert(flashcard).values({
				collectionId: id,
				term: term.trim(),
				definition: definition.trim(),
				type: 'note',
				metadata
			}).returning({ id: flashcard.id });
			
			const newId = result[0].id;
			
			if (tags.length > 0) {
				for (const t of tags) {
					await db.insert(tag).values({ name: t }).onConflictDoNothing();
				}
				const tagRecords = await db.select({ id: tag.id }).from(tag).where(inArray(tag.name, tags));
				if (tagRecords.length > 0) {
					await db.insert(flashcardTag).values(tagRecords.map(tr => ({ flashcardId: newId, tagId: tr.id })));
				}
			}
		} catch (e) {
			return fail(500, { message: 'Failed to save note' });
		}

		throw redirect(302, `/collections/${id}`);
	}
};
