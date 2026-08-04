<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import { page } from '$app/state';
	import { parseMarkdown, parseInlineMarkdown } from '$lib/markdown';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isOwner = $derived(data.collection.userId === page.data.user?.id);
	let confirmDeleteModal: ReturnType<typeof ConfirmModal> | undefined = $state();
	let deleteFormElement: HTMLFormElement | undefined = $state();
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

	{#if isOwner}
		<ConfirmModal
			bind:this={confirmDeleteModal}
			title="Delete Note"
			message="Are you sure you want to delete this note? This action cannot be undone."
			confirmText="Delete"
			confirmStyle="danger"
			onconfirm={() => {
				if (deleteFormElement) deleteFormElement.requestSubmit();
			}}
		/>
		<form bind:this={deleteFormElement} method="post" action="?/deleteNote" class="hidden"></form>
	{/if}

	<div class="flex min-h-[70vh] flex-col">
		<div class="mb-8 flex items-center justify-between">
			<div class="text-sm font-bold tracking-widest text-gray-400 uppercase">View Note</div>

			{#if isOwner}
				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={() => confirmDeleteModal?.showModal()}
						class="rounded-full bg-red-50 px-4 py-2 font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Delete
					</button>
					<a
						href="/collections/{data.collection.id}/notes/{data.note.id}/edit"
						class="rounded-full bg-blue-500 px-6 py-2 font-bold text-white shadow transition hover:bg-blue-600"
					>
						Edit
					</a>
				</div>
			{/if}
		</div>

		{#if form?.message}
			<div
				class="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400"
			>
				{form.message}
			</div>
		{/if}

		<div class="mt-4 flex flex-col">
			<div class="mb-6 w-full text-5xl font-black tracking-tight text-gray-900 dark:text-gray-100">
				{@html parseInlineMarkdown(data.note.term)}
			</div>

			{#if data.note.tags && data.note.tags.length > 0}
				<div class="mb-6 flex gap-2">
					{#each data.note.tags as tag}
						<Tag name={tag} />
					{/each}
				</div>
			{/if}

			<div class="prose prose-lg max-w-none text-left dark:prose-invert">
				{@html parseMarkdown(data.note.definition)}
			</div>
		</div>
	</div>
</div>
