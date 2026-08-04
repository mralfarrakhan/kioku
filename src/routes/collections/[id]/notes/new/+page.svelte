<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { PageData, ActionData } from './$types';
	import { parseMarkdown, parseInlineMarkdown } from '$lib/markdown';
	import TagInput from '$lib/components/TagInput.svelte';
	import Tag from '$lib/components/Tag.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
	let term = $state('');
	let definition = $state('');
	let tags = $state<string[]>([]);
</script>

<div class="mx-auto max-w-3xl">
	<div class="mb-8 flex items-center justify-between">
		<a
			href="/collections/{data.collection.id}"
			class="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
			>
			Back to Collection
		</a>
	</div>

	<form
		method="post"
		action="?/createNote"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
		class="flex min-h-[70vh] flex-col"
	>
		<div class="mb-8 flex items-center justify-between">
			<div class="text-sm font-bold tracking-widest text-gray-400 uppercase">New Note</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="rounded-full bg-blue-500 px-6 py-2 font-bold text-white shadow transition hover:bg-blue-600 disabled:opacity-50"
			>
				{isSubmitting ? 'Saving...' : 'Save Note'}
			</button>
		</div>

		{#if form?.message}
			<div
				class="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400"
			>
				{form.message}
			</div>
		{/if}

		<div class="flex flex-col gap-12">
			<div class="flex flex-col">
				<input
					type="text"
					name="term"
					bind:value={term}
					placeholder="Note Title"
					required
					class="mb-6 w-full border-0 bg-transparent p-0 text-5xl font-black tracking-tight text-gray-900 placeholder-gray-300 focus:ring-0 dark:text-gray-100 dark:placeholder-gray-700"
				/>

				<textarea
					name="definition"
					bind:value={definition}
					placeholder="Start writing..."
					required
					onkeydown={async (e) => {
						if (e.key === 'Tab' && !e.shiftKey) {
							e.preventDefault();
							const target = e.currentTarget;
							const start = target.selectionStart;
							const end = target.selectionEnd;
							definition = definition.substring(0, start) + '\t' + definition.substring(end);
							await tick();
							target.selectionStart = target.selectionEnd = start + 1;
						}
					}}
					class="min-h-[30vh] w-full resize-y border-0 bg-transparent p-0 font-mono text-xl leading-relaxed text-gray-800 placeholder-gray-300 focus:ring-0 dark:text-gray-300 dark:placeholder-gray-700"
				></textarea>
			</div>

			<div class="mt-4 border-t border-gray-100 pt-16 pb-12 dark:border-gray-800/60">
				<div class="mb-4">
					<TagInput bind:tags suggestedTags={data.allUniqueTags} />
					<input type="hidden" name="tags" value={JSON.stringify(tags)} />
				</div>
				<div
					class="mb-6 w-full text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100"
				>
					{#if term}{@html parseInlineMarkdown(term)}{:else}<span
							class="text-gray-300 dark:text-gray-700">Note Title</span
						>{/if}
				</div>
				<div class="prose prose-lg max-w-none text-left dark:prose-invert">
					{#if definition}{@html parseMarkdown(definition)}{:else}<span
							class="text-gray-300 dark:text-gray-700">Start writing...</span
						>{/if}
				</div>
			</div>
		</div>
	</form>
</div>
