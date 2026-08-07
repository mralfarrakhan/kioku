import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { collection, flashcard, userFlashcardProgress } from '$lib/server/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { QUIZ_CONFIG } from '$lib/config';

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

	// Get all items
	let allItems = await db.select().from(flashcard).where(eq(flashcard.collectionId, id));

	const tagsParam = event.url.searchParams.get('tags');
	if (tagsParam) {
		const tagsList = tagsParam
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		if (tagsList.length > 0) {
			allItems = allItems.filter((item) => {
				const itemTags = item.tags || [];
				return itemTags.some((tag) => tagsList.includes(tag));
			});
		}
	}

	const allCards = allItems.filter((i) => i.type === 'flashcard');
	const excludeNotes = event.url.searchParams.get('excludeNotes') === 'true';
	const isRandomMode = event.url.searchParams.get('mode') === 'random';
	const allNotes = excludeNotes ? [] : allItems.filter((i) => i.type === 'note');

	if (allCards.length < 4) {
		// Can't play quiz if < 4 flashcards
		return redirect(302, `/collections/${id}`);
	}

	// Get user progress for these cards and notes
	// Chunk the query to avoid Cloudflare D1's 100 parameter limit per statement
	const progressRecords = [];
	const allItemIds = allItems.map((c) => c.id);
	const chunkSize = 90; // safely under 100
	
	for (let i = 0; i < allItemIds.length; i += chunkSize) {
		const chunk = allItemIds.slice(i, i + chunkSize);
		if (chunk.length > 0) {
			const records = await db
				.select()
				.from(userFlashcardProgress)
				.where(
					and(
						eq(userFlashcardProgress.userId, event.locals.user.id),
						inArray(userFlashcardProgress.flashcardId, chunk)
					)
				);
			progressRecords.push(...records);
		}
	}

	const progressMap = new Map(progressRecords.map((p) => [p.flashcardId, p]));

	// 1. Calculate weights for each flashcard
	const weightedCards = allCards.map((card) => {
		const prog = progressMap.get(card.id);
		let weight = 0;

		if (isRandomMode) {
			weight = 100;
		} else if (!prog) {
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

	// 2. Calculate weights for each note
	const weightedNotes = allNotes.map((card) => {
		const prog = progressMap.get(card.id);
		let weight = 0;

		if (isRandomMode) {
			weight = 100;
		} else if (!prog) {
			weight = 10000;
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
	let selectedNotes: typeof allNotes = [];

	if (countParam === 'all') {
		// "All cards": Shuffle all available items exactly once
		selectedCards = shuffle([...allCards]);
		selectedNotes = shuffle([...allNotes]);
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

		if (allNotes.length > 0) {
			const noteTakeCount = Math.max(1, Math.ceil(takeCount * 0.15));
			lastDrawnId = null;
			for (let i = 0; i < noteTakeCount; i++) {
				let totalWeight = 0;
				weightedNotes.forEach((wn) => {
					wn.weight = wn.card.id === lastDrawnId && allNotes.length > 1 ? 0 : wn.baseWeight;
					totalWeight += wn.weight;
				});

				let randomValue = Math.random() * totalWeight;
				let drawnNote = null;

				for (const wn of weightedNotes) {
					randomValue -= wn.weight;
					if (randomValue <= 0) {
						drawnNote = wn.card;
						break;
					}
				}

				if (!drawnNote) drawnNote = weightedNotes[weightedNotes.length - 1].card;

				selectedNotes.push(drawnNote);
				lastDrawnId = drawnNote.id;
			}
		}
	}

	// Generate distractors for each card
	const quizSession = selectedCards.map((c) => {
		const others = allCards.filter((other) => other.id !== c.id);

		const cardTags = c.tags || [];

		// Group others by the number of shared tags
		const matchGroups = new Map<number, typeof others>();

		for (const other of others) {
			const otherTags = other.tags || [];
			let sharedCount = 0;
			if (cardTags.length > 0 && otherTags.length > 0) {
				sharedCount = otherTags.filter((t) => cardTags.includes(t)).length;
			}

			if (!matchGroups.has(sharedCount)) {
				matchGroups.set(sharedCount, []);
			}
			matchGroups.get(sharedCount)!.push(other);
		}

		// Sort the match counts descending
		const sortedMatchCounts = Array.from(matchGroups.keys()).sort((a, b) => b - a);

		const distractorCards: typeof others = [];

		// Pick from highest match groups downwards
		for (const matchCount of sortedMatchCounts) {
			if (distractorCards.length >= 3) break;

			const group = matchGroups.get(matchCount)!;
			const shuffledGroup = shuffle([...group]);

			const needed = 3 - distractorCards.length;
			distractorCards.push(...shuffledGroup.slice(0, needed));
		}

		const distractors = distractorCards.map((o) => ({ text: o.definition }));
		const options = shuffle([{ text: c.definition }, ...distractors]);

		return {
			flashcardId: c.id,
			term: c.term,
			correctAnswer: c.definition,
			options,
			type: c.type
		};
	});

	const noteSession = selectedNotes.map((c) => ({
		flashcardId: c.id,
		term: c.term,
		correctAnswer: c.definition,
		options: [],
		type: c.type
	}));

	const finalQuizSession = shuffle([...quizSession, ...noteSession]);

	return {
		collection: coll,
		quiz: finalQuizSession,
		originalQuizLength: selectedCards.length
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
			if (responseTimeMs <= QUIZ_CONFIG.fluency.fastResponseThresholdMs) quality = 5;
			else if (responseTimeMs <= QUIZ_CONFIG.fluency.averageResponseThresholdMs) quality = 4;
			else quality = 3;
		} else {
			if (responseTimeMs <= QUIZ_CONFIG.fluency.fastResponseThresholdMs) quality = 2;
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
