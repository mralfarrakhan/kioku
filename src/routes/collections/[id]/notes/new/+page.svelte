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
		<a href="/collections/{data.collection.id}" class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition dark:text-gray-400 dark:hover:text-gray-200">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
		class="flex flex-col min-h-[70vh]"
	>
		<div class="flex items-center justify-between mb-8">
			<div class="text-sm font-bold tracking-widest text-gray-400 uppercase">New Note</div>
			
			<button 
				type="submit" 
				disabled={isSubmitting}
				class="rounded-full bg-blue-500 px-6 py-2 font-bold text-white shadow hover:bg-blue-600 disabled:opacity-50 transition"
			>
				{isSubmitting ? 'Saving...' : 'Save Note'}
			</button>
		</div>

		{#if form?.message}
			<div class="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
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
					class="mb-6 w-full bg-transparent text-5xl font-black tracking-tight text-gray-900 placeholder-gray-300 border-0 p-0 focus:ring-0 dark:text-gray-100 dark:placeholder-gray-700" 
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
					class="w-full min-h-[30vh] resize-y bg-transparent font-mono text-xl text-gray-800 placeholder-gray-300 border-0 p-0 focus:ring-0 leading-relaxed dark:text-gray-300 dark:placeholder-gray-700"
				></textarea>
			</div>

			<div class="border-t border-gray-100 dark:border-gray-800/60 pt-16 pb-12 mt-4">
				<div class="mb-4">
					<TagInput bind:tags={tags} suggestedTags={data.allUniqueTags} />
					<input type="hidden" name="tags" value={JSON.stringify(tags)} />
				</div>
				<div class="mb-6 w-full text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100">
					{#if term}{@html parseInlineMarkdown(term)}{:else}<span class="text-gray-300 dark:text-gray-700">Note Title</span>{/if}
				</div>
				<div class="prose prose-lg dark:prose-invert max-w-none text-left">
					{#if definition}{@html parseMarkdown(definition)}{:else}<span class="text-gray-300 dark:text-gray-700">Start writing...</span>{/if}
				</div>
			</div>
		</div>
	</form>
</div>
