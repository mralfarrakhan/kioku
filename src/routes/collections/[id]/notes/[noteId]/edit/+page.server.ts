import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, tag, flashcardTag } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
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

	const allTagsResult = await db
		.select({ name: tag.name })
		.from(tag)
		.innerJoin(flashcardTag, eq(tag.id, flashcardTag.tagId))
		.innerJoin(flashcard, eq(flashcardTag.flashcardId, flashcard.id))
		.where(eq(flashcard.collectionId, id));

	const allUniqueTags = Array.from(new Set(allTagsResult.map((t) => t.name)));

	return {
		collection: coll,
		note: notes[0],
		allUniqueTags
	};
};

export const actions: Actions = {
	updateNote: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const { id, noteId } = event.params;
		const formData = await event.request.formData();
		const definition = formData.get('definition')?.toString();

		if (!definition) {
			return fail(400, { message: 'Content is required' });
		}

		let parsed;
		try {
			parsed = matter(definition);
		} catch (e: any) {
			return fail(400, { message: \`Invalid YAML frontmatter: \${e.message}\` });
		}

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

		try {
			await db
				.update(flashcard)
				.set({
					term: term.trim(),
					definition: definition.trim(),
					metadata,
					updatedAt: new Date()
				})
				.where(and(eq(flashcard.id, noteId), eq(flashcard.collectionId, id)));
				
			await db.delete(flashcardTag).where(eq(flashcardTag.flashcardId, noteId));
			
			if (tags.length > 0) {
				for (const t of tags) {
					await db.insert(tag).values({ name: t }).onConflictDoNothing();
				}
				const tagRecords = await db.select({ id: tag.id }).from(tag).where(inArray(tag.name, tags));
				if (tagRecords.length > 0) {
					await db.insert(flashcardTag).values(tagRecords.map(tr => ({ flashcardId: noteId, tagId: tr.id })));
				}
			}
		} catch (e) {
			return fail(500, { message: 'Failed to update note' });
		}

		throw redirect(302, `/collections/${id}/notes/${noteId}`);
	}
};
