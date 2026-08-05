<script lang="ts">
	import { goto } from '$app/navigation';

	let { collectionId } = $props<{ collectionId: string }>();

	let dialog: HTMLDialogElement | undefined = $state();
	let sessionLength = $state<'10' | '20' | '50' | 'all'>('20');

	export function showModal() {
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
	}

	function handleStart() {
		close();
		goto(`/collections/${collectionId}/quiz?count=${sessionLength}`);
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
