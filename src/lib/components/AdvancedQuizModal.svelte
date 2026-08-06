<script lang="ts">
	import { goto } from '$app/navigation';

	let { collectionId, tagCounts = [] } = $props<{
		collectionId: string;
		tagCounts?: { tag: string; count: number }[];
	}>();

	let dialog: HTMLDialogElement | undefined = $state();
	let sessionLength = $state<'10' | '20' | '50' | 'all'>('20');
	let selectedTags = $state<string[]>([]);
	let includeNotes = $state(true);

	export function showModal() {
		selectedTags = []; // Reset on open
		includeNotes = true;
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
	}

	function handleStart() {
		close();
		let url = `/collections/${collectionId}/quiz?count=${sessionLength}`;
		if (selectedTags.length > 0) {
			url += `&tags=${encodeURIComponent(selectedTags.join(','))}`;
		}
		if (!includeNotes) {
			url += `&excludeNotes=true`;
		}
		goto(url);
	}
</script>

<dialog
	bind:this={dialog}
	class="fixed inset-0 m-auto rounded-2xl border border-gray-200 p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900"
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
	onclose={close}
>
	<div
		class="w-full max-w-md p-6"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="document"
	>
		<h3 class="mb-6 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
			Advanced Quiz Options
		</h3>

		<div class="mb-8 space-y-6">
			<!-- Session Length Section -->
			<div>
				<label class="mb-3 block text-sm font-bold text-gray-700 dark:text-gray-300">
					Session Length
				</label>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{#each ['10', '20', '50', 'all'] as option}
						<label
							class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all {sessionLength ===
							option
								? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
								: 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800'}"
						>
							<input
								type="radio"
								name="sessionLength"
								value={option}
								bind:group={sessionLength}
								class="sr-only"
							/>
							<span class="font-bold">
								{option === 'all' ? 'All' : option}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Future options can easily be added here -->
			{#if tagCounts.length > 0}
				<div>
					<label class="mb-3 block text-sm font-bold text-gray-700 dark:text-gray-300">
						Filter by Tags <span class="font-normal text-gray-500">(Optional)</span>
					</label>
					<div
						class="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
					>
						<div class="flex flex-col gap-2">
							{#each tagCounts as { tag, count }}
								<label
									class="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors {count <
									4
										? 'cursor-not-allowed opacity-50'
										: 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800'}"
								>
									<input
										type="checkbox"
										value={tag}
										bind:group={selectedTags}
										disabled={count < 4}
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-600"
									/>
									<span class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
										{tag}
									</span>
									<span class="text-xs font-bold text-gray-500 dark:text-gray-400">
										({count})
									</span>
								</label>
							{/each}
						</div>
					</div>
					{#if selectedTags.length === 0}
						<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
							No tags selected. The quiz will include all cards.
						</p>
					{:else}
						<p class="mt-2 text-xs text-blue-600 dark:text-blue-400">
							{selectedTags.length} tag(s) selected. Cards matching ANY selected tag will be included.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Include Notes Section -->
			<div>
				<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800">
					<input
						type="checkbox"
						bind:checked={includeNotes}
						class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-600"
					/>
					<div class="flex-1">
						<span class="block text-sm font-bold text-gray-700 dark:text-gray-300">
							Include Notes in Quiz
						</span>
						<span class="block text-xs text-gray-500 dark:text-gray-400">
							Approximately 15% of the quiz will consist of your notes.
						</span>
					</div>
				</label>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={close}
				class="rounded-xl px-5 py-2.5 font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleStart}
				class="rounded-xl bg-blue-500 px-5 py-2.5 font-bold text-white shadow-md transition hover:bg-blue-600 hover:shadow-lg active:translate-y-px active:shadow-sm"
			>
				Start Quiz
			</button>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		animation: fade-in 0.2s ease-out;
	}
	dialog[open] {
		animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scale-up {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
