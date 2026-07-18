<script lang="ts">
	import { deserialize } from '$app/forms';
	import type { PageServerData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageServerData } = $props();

	let quizCards = $state(data.quiz);
	let currentIndex = $state(0);

	let currentCard = $derived(quizCards[currentIndex]);
	let isFinished = $derived(currentIndex >= quizCards.length);

	let selectedOption = $state<string | null>(null);
	let isCorrect = $state<boolean | null>(null);
	let questionStartTime = $state<number>(Date.now());

	let totalCorrect = $state(0);
	let totalResponseTime = $state(0);
	let answeredCards = $state(0);

	let oldScore = $state<number | null>(null);
	let newScore = $state<number | null>(null);
	let fluencyChange = $state<number | null>(null);

	async function handleOptionClick(option: string) {
		if (selectedOption !== null) return; // Prevent double-clicking

		selectedOption = option;
		isCorrect = option === currentCard.correctAnswer;

		const responseTimeMs = Date.now() - questionStartTime;

		if (isCorrect) totalCorrect++;
		totalResponseTime += responseTimeMs;
		answeredCards++;

		// Submit the result asynchronously
		const formData = new FormData();
		formData.append('flashcardId', currentCard.flashcardId);
		formData.append('isCorrect', String(isCorrect));
		formData.append('responseTimeMs', String(responseTimeMs));

		const response = await fetch('?/recordResult', {
			method: 'POST',
			body: formData
		});

		const result = deserialize(await response.text());
		if (result.type === 'success' && result.data) {
			oldScore = result.data.oldScore as number;
			// short delay so the ring renders at the old score first, then animates to the new score
			setTimeout(() => {
				newScore = result.data?.newScore as number;
				fluencyChange = (result.data?.newScore as number) - (result.data?.oldScore as number);
			}, 50);
		}

		// Move to next question after delay
		setTimeout(
			() => {
				currentIndex++;
				selectedOption = null;
				isCorrect = null;
				oldScore = null;
				newScore = null;
				fluencyChange = null;
				questionStartTime = Date.now();
			},
			isCorrect ? 1500 : 2500
		); // 1.5s/2.5s to see the animation
	}
</script>

<div class="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-8">
	<div class="mb-8 flex items-center gap-4">
		<a
			href="/collections/{data.collection.id}"
			class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
			>
		</a>
		<div class="h-4 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
			<div
				class="h-full bg-green-500 transition-all duration-300 ease-out"
				style="width: {(currentIndex / quizCards.length) * 100}%"
			></div>
		</div>
		<span class="text-sm font-bold text-gray-500 dark:text-gray-400"
			>{currentIndex}/{quizCards.length}</span
		>
	</div>

	<div class="flex flex-1 flex-col justify-center">
		{#if !isFinished}
			<div class="mb-10 text-center">
				<h2
					class="text-4xl font-extrabold whitespace-pre-wrap text-gray-900 md:text-5xl dark:text-gray-100"
				>
					{currentCard.term}
				</h2>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				{#each currentCard.options as option}
					<button
						onclick={() => handleOptionClick(option)}
						disabled={selectedOption !== null}
						class="relative flex min-h-[100px] w-full items-center justify-center rounded-2xl border-2 p-6 text-center text-lg font-bold transition-all
							{selectedOption === null
							? 'border-gray-200 bg-white text-gray-700 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50 hover:shadow-[0_4px_0_0_rgba(147,197,253,1)] active:translate-y-1 active:shadow-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-[0_4px_0_0_rgba(31,41,55,1)] dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:shadow-[0_4px_0_0_rgba(59,130,246,0.5)]'
							: ''}
							{selectedOption === option && isCorrect
							? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
							: ''}
							{selectedOption === option && !isCorrect
							? 'border-red-500 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
							: ''}
							{selectedOption !== null && selectedOption !== option && option === currentCard.correctAnswer
							? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-2 dark:bg-green-900/20 dark:text-green-400 dark:ring-offset-gray-950'
							: ''}
							{selectedOption !== null && selectedOption !== option && option !== currentCard.correctAnswer
							? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500'
							: ''}"
					>
						{option}
					</button>
				{/each}
			</div>

			<!-- Status indicator area -->
			<div class="mt-8 flex h-20 items-center justify-center">
				{#if isCorrect !== null}
					<div class="flex items-center gap-6">
						<div
							class="flex items-center gap-2 text-xl font-extrabold {isCorrect
								? 'animate-bounce text-green-500'
								: 'text-red-500'}"
						>
							{#if isCorrect}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg
								>
								Awesome!
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg
								>
								Correct answer: {currentCard.correctAnswer}
							{/if}
						</div>

						{#if oldScore !== null}
							{@const currentTotal = newScore !== null ? newScore : oldScore}
							{@const currentProgress = currentTotal % 100}
							{@const currentLevel = Math.floor(currentTotal / 100)}
							<div
								class="animate-fade-in flex items-center gap-3 border-l-2 border-gray-100 pl-6 dark:border-gray-800"
							>
								<div class="relative flex h-14 w-14 items-center justify-center">
									<svg
										class="absolute inset-0 h-full w-full -rotate-90 transform"
										viewBox="0 0 36 36"
									>
										<circle
											cx="18"
											cy="18"
											r="15"
											fill="none"
											class="stroke-gray-100 dark:stroke-gray-800"
											stroke-width="4"
										></circle>
										<circle
											cx="18"
											cy="18"
											r="15"
											fill="none"
											class={currentLevel >= 3
												? 'stroke-green-500'
												: currentLevel >= 1
													? 'stroke-blue-500'
													: 'stroke-yellow-400'}
											stroke-width="4"
											stroke-dasharray="94.2"
											stroke-dashoffset={94.2 - (currentProgress / 100) * 94.2}
											stroke-linecap="round"
											style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);"
										></circle>
									</svg>
									<span class="relative text-xs font-bold text-gray-700 dark:text-gray-300">
										Lv.{currentLevel}
									</span>
								</div>
								{#if fluencyChange !== null}
									<span
										class="text-lg font-extrabold {fluencyChange > 0
											? 'text-green-500'
											: 'text-red-500'} animate-slide-up"
									>
										{fluencyChange > 0 ? '+' : ''}{fluencyChange} XP
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="animate-fade-in flex h-full flex-col items-center justify-center text-center">
				<div class="mb-6 rounded-full bg-green-100 p-6 dark:bg-green-900/30">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="64"
						height="64"
						class="text-green-500"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M12 15l-2 5l9-9l-9-1v-5h-3l2-5l-9 9l9 1v5h3l-2 5z" /></svg
					>
				</div>
				<h2 class="mb-2 text-4xl font-extrabold text-gray-900 dark:text-gray-100">
					Session Complete!
				</h2>
				<p class="mb-8 text-xl text-gray-500 dark:text-gray-400">
					You earned {totalCorrect} correct answers.
				</p>

				<div class="mb-8 grid w-full max-w-sm grid-cols-2 gap-4">
					<div
						class="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
					>
						<div class="text-3xl font-extrabold text-blue-500">
							{Math.round((totalCorrect / quizCards.length) * 100)}%
						</div>
						<div class="text-sm font-bold text-gray-400 dark:text-gray-500">Accuracy</div>
					</div>
					<div
						class="rounded-2xl border-2 border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
					>
						<div class="text-3xl font-extrabold text-orange-500">
							{(totalResponseTime / quizCards.length / 1000).toFixed(1)}s
						</div>
						<div class="text-sm font-bold text-gray-400 dark:text-gray-500">Avg Speed</div>
					</div>
				</div>

				<a
					href="/collections/{data.collection.id}"
					class="w-full max-w-sm rounded-2xl bg-blue-500 py-4 text-center text-xl font-extrabold text-white shadow-[0_4px_0_0_rgba(37,99,235,1)] transition hover:-translate-y-1 hover:shadow-[0_6px_0_0_rgba(37,99,235,1)] active:translate-y-1 active:shadow-none"
				>
					Continue
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out forwards;
	}

	@keyframes slide-up {
		0% {
			opacity: 0;
			transform: translateY(10px);
		}
		50% {
			opacity: 1;
			transform: translateY(-5px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-slide-up {
		animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
</style>
