import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, user, flashcard } from '$lib/server/db/schema';
import { eq, or, and, desc, count } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const db = getDb(event.platform?.env?.DB as D1Database);

	// Pagination parameters
	const url = new URL(event.request.url);
	const page = parseInt(url.searchParams.get('page') || '1') || 1;
	const pageSize = 12;

	// Total count for pagination
	const countResult = await db
		.select({ value: count() })
		.from(collection)
		.where(or(eq(collection.userId, event.locals.user.id), eq(collection.isShared, true)));
	const totalItems = countResult[0].value;
	const totalPages = Math.ceil(totalItems / pageSize);

	// Fetch collections: either owned by the user, or shared
	const collections = await db
		.select({
			id: collection.id,
			title: collection.title,
			description: collection.description,
			isShared: collection.isShared,
			createdAt: collection.createdAt,
			updatedAt: collection.updatedAt,
			userId: collection.userId,
			authorName: user.name,
			flashcardCount: count(flashcard.id)
		})
		.from(collection)
		.leftJoin(user, eq(collection.userId, user.id))
		.leftJoin(flashcard, eq(collection.id, flashcard.collectionId))
		.where(or(eq(collection.userId, event.locals.user.id), eq(collection.isShared, true)))
		.groupBy(collection.id)
		.orderBy(desc(collection.updatedAt), desc(collection.createdAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		user: event.locals.user,
		collections,
		pagination: {
			page,
			totalPages,
			totalItems
		}
	};
};

export const actions: Actions = {
	createCollection: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString();
		const description = formData.get('description')?.toString();
		const isShared = formData.get('isShared')?.toString() === 'on';

		if (!title) {
			return fail(400, { message: 'Title is required' });
		}

		const db = getDb(event.platform?.env?.DB as D1Database);

		try {
			await db.insert(collection).values({
				userId: user.id,
				title,
				description,
				isShared
			});
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to create collection' });
		}
	},

	deleteCollection: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await event.request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return fail(400, { message: 'ID is required' });

		const db = getDb(event.platform?.env?.DB as D1Database);

		try {
			await db.delete(collection).where(and(eq(collection.id, id), eq(collection.userId, user.id)));
			return { success: true };
		} catch (e) {
			return fail(500, { message: 'Failed to delete collection' });
		}
	},

	signOut: async (event) => {
		const { auth } = event.locals;
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	}
};
