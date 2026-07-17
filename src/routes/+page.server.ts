import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, user } from '$lib/server/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const db = getDb(event.platform?.env?.DB as D1Database);

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
			authorName: user.name
		})
		.from(collection)
		.leftJoin(user, eq(collection.userId, user.id))
		.where(or(eq(collection.userId, event.locals.user.id), eq(collection.isShared, true)))
		.orderBy(desc(collection.updatedAt), desc(collection.createdAt));

	return {
		user: event.locals.user,
		collections
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
