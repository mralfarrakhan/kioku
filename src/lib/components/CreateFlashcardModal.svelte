<script lang="ts">
	import { enhance } from '$app/forms';
	import { parseMarkdown } from '$lib/markdown';
	import { toast } from '$lib/stores/toast.svelte';
	import TagInput from './TagInput.svelte';

	let { suggestedTags = [] } = $props<{ suggestedTags?: string[] }>();

	let createCardDialog: HTMLDialogElement | undefined = $state();
	let createCardError = $state<string | null>(null);
	let termInputEl: HTMLTextAreaElement | undefined = $state();
	let newCardTerm = $state('');
	let newCardDef = $state('');
	let newCardMarkdown = $state(false);
	let newCardTags = $state<string[]>([]);

	export function showModal() {
		createCardDialog?.showModal();
	}

	export function closeModal() {
		createCardDialog?.close();
	}
</script>

<dialog
	bind:this={createCardDialog}
	onclose={() => (createCardError = null)}
	class="m-auto w-full max-w-2xl rounded-2xl border-0 bg-white p-6 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border dark:border-gray-800 dark:bg-gray-900"
>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Flashcard</h2>
		<button
			type="button"
			onclick={closeModal}
			class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
			aria-label="Close modal"
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
		</button>
	</div>

	{#if createCardError}
		<div
			class="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400"
		>
			{createCardError}
		</div>
	{/if}

	<form
		method="post"
		action="?/createFlashcard"
		use:enhance={() => {
			createCardError = null;
			return async ({ result, update, formElement }) => {
				if (result.type === 'failure') {
					createCardError = result.data?.message as string;
				} else if (result.type === 'success') {
					await update();
					formElement.reset();
					newCardTerm = '';
					newCardDef = '';
					newCardMarkdown = false;
					newCardTags = [];
					closeModal();
					toast.success('Flashcard added successfully!');
				}
			};
		}}
	>
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<label for="term" class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
					>Term / Question</label
				>
				<textarea
					id="term"
					name="term"
					required
					rows="3"
					maxlength="255"
					bind:value={newCardTerm}
					bind:this={termInputEl}
					class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				></textarea>
			</div>
			<div>
				<label for="definition" class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
					>Definition / Answer</label
				>
				<textarea
					id="definition"
					name="definition"
					required
					rows="3"
					maxlength="1000"
					bind:value={newCardDef}
					class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				></textarea>
			</div>
		</div>

		<div class="mt-4">
			<label class="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</label>
			<TagInput bind:tags={newCardTags} {suggestedTags} />
			<input type="hidden" name="tags" value={JSON.stringify(newCardTags)} />
		</div>

		<div class="mt-4 flex items-center">
			<input
				type="checkbox"
				name="isMarkdown"
				id="isMarkdownAdd"
				bind:checked={newCardMarkdown}
				class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
			/>
			<label
				for="isMarkdownAdd"
				class="ml-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
				>Advanced Formatting (Markdown)</label
			>
		</div>

		{#if newCardMarkdown}
			<div
				class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
			>
				<p class="mb-2 text-xs font-bold text-gray-500 uppercase">Live Preview</p>
				<div class="text-center">
					<div class="border-b border-gray-200 pb-3 dark:border-gray-700">
						<div
							class="text-xl font-extrabold whitespace-pre-wrap text-gray-900 dark:text-gray-100"
						>
							{#if newCardTerm}
								{@html parseMarkdown(newCardTerm)}
							{:else}
								<span class="text-gray-400">Term...</span>
							{/if}
						</div>
					</div>
					<div class="pt-3">
						<div class="text-lg whitespace-pre-wrap text-gray-700 dark:text-gray-300">
							{#if newCardDef}
								{@html parseMarkdown(newCardDef)}
							{:else}
								<span class="text-gray-400">Definition...</span>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="mt-6 flex justify-end gap-3">
			<button
				type="button"
				onclick={closeModal}
				class="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>Cancel</button
			>
			<button
				type="submit"
				class="rounded-xl bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
				>Add Card</button
			>
		</div>
	</form>
</dialog>
