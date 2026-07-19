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

	// 1. Calculate weights for each card
	const weightedCards = allCards.map((card) => {
		const prog = progressMap.get(card.id);
		let weight = 0;

		if (!prog) {
			weight = 10000; // Brand new cards have very high weight
		} else {
			const isDue = !prog.nextReviewAt || new Date(prog.nextReviewAt) <= new Date();
			if (isDue) {
				weight = 5000 + (100 - Math.min(prog.repetitions * 20, 100));
			} else {
				weight = Math.max(1, 100 - prog.repetitions * 20);
			}
		}
		return { card, weight, baseWeight: weight };
	});

	// Parse count
	const countParam = event.url.searchParams.get('count');
	let takeCount = 20;
	if (countParam && !isNaN(parseInt(countParam))) {
		takeCount = parseInt(countParam);
	}

	let selectedCards: typeof allCards = [];

	if (countParam === 'all') {
		// "All cards": Shuffle all available items exactly once
		selectedCards = shuffle([...allCards]);
	} else {
		// N items: Weighted random sample with replacement
		let lastDrawnId: string | null = null;

		for (let i = 0; i < takeCount; i++) {
			let totalWeight = 0;
			// Temporarily zero the weight of the last drawn card if there's more than 1 card to avoid consecutive repeats
			weightedCards.forEach((wc) => {
				wc.weight = wc.card.id === lastDrawnId && allCards.length > 1 ? 0 : wc.baseWeight;
				totalWeight += wc.weight;
			});

			let randomValue = Math.random() * totalWeight;
			let drawnCard = null;

			for (const wc of weightedCards) {
				randomValue -= wc.weight;
				if (randomValue <= 0) {
					drawnCard = wc.card;
					break;
				}
			}

			// Fallback in case of rounding issues
			if (!drawnCard) drawnCard = weightedCards[weightedCards.length - 1].card;

			selectedCards.push(drawnCard);
			lastDrawnId = drawnCard.id;
		}
	}

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
			if (responseTimeMs <= 3000) quality = 5;
			else if (responseTimeMs <= 5000) quality = 4;
			else quality = 3;
		} else {
			if (responseTimeMs <= 3000) quality = 2;
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
		if (quality === 5) xpChange = 25;
		else if (quality === 4) xpChange = 15;
		else if (quality === 3) xpChange = 10;
		else if (quality === 2) xpChange = -10;
		else xpChange = -20;

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
