<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { PageData, ActionData } from './$types';
	import { parseMarkdown, parseInlineMarkdown } from '$lib/markdown';
	import Tag from '$lib/components/Tag.svelte';
	import PremiumFeatureModal from '$lib/components/PremiumFeatureModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
	let definition = $state('');
	let premiumModal: ReturnType<typeof PremiumFeatureModal> | undefined = $state();

	let previewData = $derived.by(() => {
		let title = '';
		let tags: string[] = [];
		let cleanContent = definition;
		let metadata: Record<string, string> = {};

		const fmMatch = definition.match(/^---\n([\s\S]*?)\n---/);
		if (fmMatch) {
			cleanContent = definition.slice(fmMatch[0].length).trimStart();
			const lines = fmMatch[1].split('\n');
			for (const line of lines) {
				const match = line.match(/^([^:]+):\s*(.*)$/);
				if (match) {
					const key = match[1].trim();
					let value = match[2].trim();

					if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
					else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

					if (key === 'title') {
						title = value;
					} else if (key === 'tags') {
						if (value.startsWith('[') && value.endsWith(']')) {
							tags = value
								.slice(1, -1)
								.split(',')
								.map((t) => t.trim().replace(/^["']|["']$/g, ''))
								.filter(Boolean);
						} else {
							tags = value
								.split(',')
								.map((t) => t.trim())
								.filter(Boolean);
						}
					} else {
						metadata[key] = value;
					}
				}
			}
		}

		if (!title) {
			const h1Match = cleanContent.match(/^#\s+(.+)$/m);
			if (h1Match) title = h1Match[1].trim();
		}

		return { title, tags, cleanContent, metadata };
	});
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
			return async ({ result, update }) => {
				if (result.type === 'failure' && result.data?.limitReached) {
					isSubmitting = false;
					premiumModal?.showModal(result.data.limitMessage as string, 'Limit Reached');
					return;
				}
				await update();
				isSubmitting = false;
			};
		}}
		class="flex min-h-[70vh] flex-col"
	>
		<div class="mb-8 flex items-center justify-between">
			<div class="text-sm font-bold tracking-widest text-gray-400 uppercase">New Note</div>

			<div class="flex flex-col items-end gap-1">
				<button
					type="submit"
					disabled={isSubmitting || (definition.trim().length > 0 && !previewData.title)}
					class="rounded-full bg-blue-500 px-6 py-2 font-bold text-white shadow transition hover:bg-blue-600 disabled:opacity-50"
				>
					{isSubmitting ? 'Saving...' : 'Save Note'}
				</button>
				{#if definition.trim().length > 0 && !previewData.title}
					<span class="text-xs font-medium text-red-500"
						>A title in frontmatter or # Heading is required</span
					>
				{/if}
			</div>
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

			<div class="mt-4 flex flex-col border-t border-gray-100 pt-16 pb-12 dark:border-gray-800/60">
				{#if definition}
					<div
						class="mb-6 w-full text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100"
					>
						{#if previewData.title}
							{@html parseInlineMarkdown(previewData.title)}
						{:else}
							<span class="text-gray-300 dark:text-gray-700">Untitled Note</span>
						{/if}
					</div>

					{#if previewData.metadata.description}
						<div class="mb-6 text-xl text-gray-600 dark:text-gray-400">
							{previewData.metadata.description}
						</div>
					{/if}

					{#if previewData.tags.length > 0}
						<div class="mb-6 flex gap-2">
							{#each previewData.tags as tag}
								<Tag name={tag} />
							{/each}
						</div>
					{/if}

					<div class="prose prose-lg max-w-none text-left dark:prose-invert">
						{@html parseMarkdown(previewData.cleanContent)}
					</div>
				{:else}
					<div class="prose prose-lg max-w-none text-left dark:prose-invert">
						<span class="text-gray-300 dark:text-gray-700">Preview will appear here...</span>
					</div>
				{/if}
			</div>
		</div>
	</form>
</div>

<PremiumFeatureModal bind:this={premiumModal} />
