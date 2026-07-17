import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, userFlashcardProgress } from '$lib/server/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

// Simple shuffle function
function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length;
	let randomIndex;
	while (currentIndex > 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const id = event.params.id;
	const db = getDb(event.platform?.env?.DB as D1Database);

	const collections = await db.select().from(collection).where(eq(collection.id, id));
	if (collections.length === 0) return redirect(302, '/');
	const coll = collections[0];

	if (coll.userId !== event.locals.user.id && !coll.isShared) {
		return redirect(302, '/');
	}

	// Get all flashcards
	const allCards = await db.select().from(flashcard).where(eq(flashcard.collectionId, id));
	if (allCards.length < 4) {
		// Can't play quiz if < 4 cards
		return redirect(302, `/collections/${id}`);
	}

	// Get user progress for these cards
	const progressRecords = await db
		.select()
		.from(userFlashcardProgress)
		.where(
			and(
				eq(userFlashcardProgress.userId, event.locals.user.id),
				inArray(
					userFlashcardProgress.flashcardId,
					allCards.map((c) => c.id)
				)
			)
		);

	const progressMap = new Map(progressRecords.map((p) => [p.flashcardId, p]));

	// Score each card for sorting:
	const scoredCards = allCards.map((card) => {
		const prog = progressMap.get(card.id);
		let priorityScore = 0;

		if (!prog) {
			priorityScore = 10000; // Brand new cards highest priority
		} else {
			const isDue = !prog.nextReviewAt || new Date(prog.nextReviewAt) <= new Date();
			if (isDue) {
				priorityScore = 5000 + (100 - prog.repetitions * 20); // Due cards, lower reps first
			} else {
				// Not due? Add some randomness weighted by how low their level is
				priorityScore = Math.random() * (100 - prog.repetitions * 20);
			}
		}
		return { card, priorityScore };
	});

	// Sort descending by priorityScore
	scoredCards.sort((a, b) => b.priorityScore - a.priorityScore);

	// Parse count
	const countParam = event.url.searchParams.get('count');
	let takeCount = 20;
	if (countParam === 'all') {
		takeCount = allCards.length;
	} else if (countParam && !isNaN(parseInt(countParam))) {
		takeCount = parseInt(countParam);
	}
	// Cap at max available
	takeCount = Math.min(takeCount, allCards.length);

	const selectedCards = scoredCards.slice(0, takeCount).map((s) => s.card);

	// Generate distractors for each card
	const quizSession = selectedCards.map((c) => {
		// Get 3 other random definitions from the same collection
		const others = allCards.filter((other) => other.id !== c.id);
		const distractors = shuffle(others)
			.slice(0, 3)
			.map((o) => o.definition);

		const options = shuffle([c.definition, ...distractors]);

		return {
			flashcardId: c.id,
			term: c.term,
			correctAnswer: c.definition,
			options
		};
	});

	return {
		collection: coll,
		quiz: quizSession
	};
};

export const actions: Actions = {
	recordResult: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await event.request.formData();
		const flashcardId = formData.get('flashcardId')?.toString();
		const isCorrect = formData.get('isCorrect') === 'true';
		const responseTimeMs = parseInt(formData.get('responseTimeMs')?.toString() || '0');

		if (!flashcardId) return fail(400);

		const db = getDb(event.platform?.env?.DB as D1Database);

		// Determine SM-2 Quality (1-5)
		let quality = 1;
		if (isCorrect) {
			if (responseTimeMs <= 500) quality = 5;
			else if (responseTimeMs <= 1000) quality = 4;
			else quality = 3;
		} else {
			if (responseTimeMs <= 1000) quality = 2;
			else quality = 1;
		}

		// Find existing progress
		const existing = await db
			.select()
			.from(userFlashcardProgress)
			.where(
				and(
					eq(userFlashcardProgress.userId, user.id),
					eq(userFlashcardProgress.flashcardId, flashcardId)
				)
			);

		const currentEase = existing.length > 0 ? existing[0].easeFactor : 2.5;
		const currentInterval = existing.length > 0 ? existing[0].interval : 0;
		const currentRepetitions = existing.length > 0 ? existing[0].repetitions : 0;

		// Calculate SM-2
		let newEaseFactor = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
		if (newEaseFactor < 1.3) newEaseFactor = 1.3;

		let newInterval = 0;
		let newRepetitions = 0;

		if (quality >= 3) {
			if (currentRepetitions === 0) newInterval = 1;
			else if (currentRepetitions === 1) newInterval = 6;
			else newInterval = Math.round(currentInterval * newEaseFactor);
			newRepetitions = currentRepetitions + 1;
		} else {
			newRepetitions = 0;
			newInterval = 1;
		}

		// Calculate visual XP (fluencyScore acts as Total XP)
		const oldTotalXp = existing.length > 0 ? existing[0].fluencyScore : 0;
		let xpChange = 0;
		if (quality === 5) xpChange = 100;
		else if (quality === 4) xpChange = 50;
		else if (quality === 3) xpChange = 25;
		else xpChange = -100;

		const newTotalXp = Math.max(0, oldTotalXp + xpChange);

		const now = new Date();
		const nextReview = new Date(now.getTime() + newInterval * 1000 * 60 * 60 * 24);

		if (existing.length === 0) {
			await db.insert(userFlashcardProgress).values({
				userId: user.id,
				flashcardId: flashcardId,
				fluencyScore: newTotalXp,
				easeFactor: newEaseFactor,
				interval: newInterval,
				repetitions: newRepetitions,
				lastReviewedAt: now,
				nextReviewAt: nextReview
			});
			return { success: true, oldScore: oldTotalXp, newScore: newTotalXp };
		} else {
			await db
				.update(userFlashcardProgress)
				.set({
					fluencyScore: newTotalXp,
					easeFactor: newEaseFactor,
					interval: newInterval,
					repetitions: newRepetitions,
					lastReviewedAt: now,
					nextReviewAt: nextReview
				})
				.where(eq(userFlashcardProgress.id, existing[0].id));

			return { success: true, oldScore: oldTotalXp, newScore: newTotalXp };
		}
	}
};
