<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	let showCreateModal = $state(false);
</script>

<div class="mb-8 flex items-center justify-between">
	<div>
		<h1 class="text-3xl font-extrabold text-gray-900">Collections</h1>
		<p class="mt-1 text-gray-500">Learn and review your flashcards</p>
	</div>
	<button
		onclick={() => (showCreateModal = true)}
		class="rounded-xl bg-blue-500 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-600 hover:shadow"
	>
		+ New Collection
	</button>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-bold text-gray-900">Create Collection</h2>
			<form
				method="post"
				action="?/createCollection"
				use:enhance={() => {
					return async ({ update }) => {
						showCreateModal = false;
						await update();
					};
				}}
			>
				<div class="mb-4">
					<label class="block text-sm font-semibold text-gray-700">Title</label>
					<input
						type="text"
						name="title"
						required
						class="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						placeholder="e.g. Japanese Vocab"
					/>
				</div>
				<div class="mb-4">
					<label class="block text-sm font-semibold text-gray-700">Description</label>
					<textarea
						name="description"
						class="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
						placeholder="Optional..."></textarea>
				</div>
				<div class="mb-6 flex items-center">
					<input
						type="checkbox"
						name="isShared"
						id="isShared"
						class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="isShared" class="ml-2 block text-sm font-semibold text-gray-700"
						>Make Public (Shared)</label
					>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
					>
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if data.collections.length === 0}
	<div class="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
		<h3 class="text-xl font-bold text-gray-700">No collections yet!</h3>
		<p class="mt-2 text-gray-500">Create one or discover shared collections.</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.collections as collection}
			<a
				href="/collections/{collection.id}"
				class="group relative flex flex-col justify-between rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
			>
				<div>
					<div class="mb-2 flex items-start justify-between">
						<h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600">
							{collection.title}
						</h3>
						{#if collection.isShared}
							<span class="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700"
								>Shared</span
							>
						{/if}
					</div>
					{#if collection.description}
						<p class="line-clamp-2 text-sm text-gray-500">{collection.description}</p>
					{/if}
				</div>

				<div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
					<div class="flex flex-col gap-0.5">
						<span class="text-xs font-semibold text-gray-400">
							{#if collection.userId === data.user.id}
								Yours
							{:else}
								By <span class="text-gray-600">{collection.authorName || 'Unknown'}</span>
							{/if}
						</span>
						<span
							class="text-[10px] font-medium text-gray-400"
							title="Created: {new Date(collection.createdAt).toLocaleDateString()}"
						>
							Updated {new Date(collection.updatedAt).toLocaleDateString()}
						</span>
					</div>

					{#if collection.userId === data.user.id}
						<!-- Use preventDefault to stop the anchor link from triggering -->
						<form
							method="post"
							action="?/deleteCollection"
							use:enhance
							onsubmit={(e) => {
								if (!confirm('Are you sure you want to delete this collection?'))
									e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={collection.id} />
							<button
								type="submit"
								class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
								onclick={(e) => e.stopPropagation()}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
										d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
									/><line x1="10" x2="10" y1="11" y2="17" /><line
										x1="14"
										x2="14"
										y1="11"
										y2="17"
									/></svg
								>
							</button>
						</form>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
