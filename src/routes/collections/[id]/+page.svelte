<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import { page } from '$app/state';

	let { data }: { data: PageServerData } = $props();

	let isOwner = $derived(data.collection.userId === page.data.user?.id);

	let showEditCollection = $state(false);
	let showQuizOptions = $state(false);

	let createCardDialog: HTMLDialogElement | undefined = $state();
	let createCardError = $state<string | null>(null);
	let termInputEl: HTMLTextAreaElement | undefined = $state();

	let editCardId = $state<string | null>(null);
	let editCardTerm = $state('');
	let editCardDef = $state('');

	function startEditCard(id: string, term: string, def: string) {
		editCardId = id;
		editCardTerm = term;
		editCardDef = def;
	}
</script>

<div class="mb-6">
	<a href="/" class="mb-4 flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
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
		Back to Home
	</a>

	<div class="flex items-start justify-between">
		<div>
			<h1 class="flex items-center gap-3 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
				{data.collection.title}
				{#if data.collection.isShared}
					<span class="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700"
						>Shared</span
					>
				{/if}
			</h1>
			{#if data.collection.description}
				<p class="mt-2 text-lg text-gray-600 dark:text-gray-400">{data.collection.description}</p>
			{/if}
		</div>

		{#if isOwner}
			<div class="flex gap-2">
				<button
					onclick={() => (showEditCollection = true)}
					class="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
				>
					Edit Info
				</button>
				<button
					onclick={() => createCardDialog?.showModal()}
					class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-blue-600 hover:shadow"
				>
					+ Add Card
				</button>
			</div>
		{/if}
	</div>
</div>

{#if showEditCollection && isOwner}
	<div
		class="mb-8 rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900"
	>
		<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Edit Collection</h2>
		<form
			method="post"
			action="?/editCollection"
			use:enhance={() => {
				return async ({ update }) => {
					showEditCollection = false;
					await update();
				};
			}}
		>
			<div class="mb-4">
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Title</label>
				<input
					type="text"
					name="title"
					value={data.collection.title}
					required
					class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				/>
			</div>
			<div class="mb-4">
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
					>Description</label
				>
				<textarea
					name="description"
					class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					>{data.collection.description || ''}</textarea
				>
			</div>
			<div class="mb-6 flex items-center">
				<input
					type="checkbox"
					name="isShared"
					id="isShared"
					checked={data.collection.isShared}
					class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
				/>
				<label
					for="isShared"
					class="ml-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
					>Make Public (Shared)</label
				>
			</div>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (showEditCollection = false)}
					class="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>Cancel</button
				>
				<button
					type="submit"
					class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
					>Save Changes</button
				>
			</div>
		</form>
	</div>
{/if}

{#if isOwner}
	<dialog
		bind:this={createCardDialog}
		onclose={() => (createCardError = null)}
		class="m-auto w-full max-w-2xl rounded-2xl border-0 bg-white p-6 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border dark:border-gray-800 dark:bg-gray-900"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Flashcard</h2>
			<button
				type="button"
				onclick={() => createCardDialog?.close()}
				class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
						termInputEl?.focus();
					}
				};
			}}
		>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
						>Term / Question</label
					>
					<textarea
						name="term"
						required
						rows="3"
						maxlength="255"
						bind:this={termInputEl}
						class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					></textarea>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
						>Definition / Answer</label
					>
					<textarea
						name="definition"
						required
						rows="3"
						maxlength="1000"
						class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
					></textarea>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => createCardDialog?.close()}
					class="rounded-xl bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>Done</button
				>
				<button
					type="submit"
					class="rounded-xl bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
					>Add Card</button
				>
			</div>
		</form>
	</dialog>
{/if}

<div
	class="mb-8 flex flex-col justify-between gap-4 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center dark:border-gray-800 dark:bg-gray-800"
>
	<div>
		<h2 class="text-xl font-extrabold text-gray-900 dark:text-gray-100">Quiz Mode</h2>
		<p class="mt-1 font-medium text-gray-500 dark:text-gray-400">
			Review flashcards to build fluency.
		</p>
	</div>

	<div class="flex items-center gap-3">
		{#if data.flashcards.length >= 4}
			<div class="relative flex items-center gap-2">
				<a
					href="/collections/{data.collection.id}/quiz?count=20"
					class="inline-flex rounded-xl bg-blue-500 px-6 py-3 font-extrabold text-white shadow-[0_4px_0_0_rgba(37,99,235,1)] transition hover:-translate-y-1 hover:shadow-[0_6px_0_0_rgba(37,99,235,1)] active:translate-y-1 active:shadow-none"
				>
					Review Now
				</a>
				<button
					onclick={() => (showQuizOptions = !showQuizOptions)}
					class="inline-flex h-[48px] w-[48px] items-center justify-center rounded-xl border-2 border-gray-200 bg-white font-extrabold text-gray-400 shadow-[0_4px_0_0_rgba(229,231,235,1)] transition hover:-translate-y-1 hover:border-gray-300 hover:text-gray-500 hover:shadow-[0_6px_0_0_rgba(229,231,235,1)] active:translate-y-1 active:shadow-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 dark:shadow-[0_4px_0_0_rgba(31,41,55,1)] dark:hover:border-gray-600 dark:hover:text-gray-400 dark:hover:shadow-[0_6px_0_0_rgba(31,41,55,1)]"
					aria-label="Session Length Options"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle
							cx="12"
							cy="19"
							r="1"
						/></svg
					>
				</button>
				<!-- Simple extra options dropdown on click -->
				{#if showQuizOptions}
					<!-- Invisible overlay to handle click outside -->
					<button
						type="button"
						class="fixed inset-0 z-10 h-full w-full cursor-default bg-transparent outline-none"
						onclick={() => (showQuizOptions = false)}
						aria-label="Close options"
					></button>
					<div
						class="absolute top-full right-0 z-20 mt-3 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
					>
						<div
							class="px-3 py-2 text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500"
						>
							Session Length
						</div>
						<a
							href="/collections/{data.collection.id}/quiz?count=10"
							class="block rounded-lg px-3 py-2 font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
							>10 cards</a
						>
						<a
							href="/collections/{data.collection.id}/quiz?count=20"
							class="block rounded-lg px-3 py-2 font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
							>20 cards (Default)</a
						>
						<a
							href="/collections/{data.collection.id}/quiz?count=50"
							class="block rounded-lg px-3 py-2 font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
							>50 cards</a
						>
						<a
							href="/collections/{data.collection.id}/quiz?count=all"
							class="block rounded-lg px-3 py-2 font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
							>All cards</a
						>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-3">
				<div
					class="cursor-not-allowed rounded-xl bg-gray-100 px-6 py-3 font-extrabold text-gray-400 dark:bg-gray-800 dark:text-gray-500"
				>
					Review Now
				</div>
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
					Add {4 - data.flashcards.length} more card{data.flashcards.length === 3 ? '' : 's'} to unlock.
				</p>
			</div>
		{/if}
	</div>
</div>

<div class="mt-8">
	<div
		class="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-800"
	>
		<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
			Flashcards <span class="text-sm text-gray-400 dark:text-gray-500"
				>({data.flashcards.length})</span
			>
		</h2>
	</div>

	{#if data.flashcards.length === 0}
		<div
			class="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-lg font-bold text-gray-500 dark:text-gray-400">This collection is empty.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.flashcards as card (card.id)}
				<div
					class="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
				>
					{#if editCardId === card.id && isOwner}
						<form
							method="post"
							action="?/editFlashcard"
							use:enhance={() => {
								return async ({ update }) => {
									editCardId = null;
									await update();
								};
							}}
						>
							<input type="hidden" name="id" value={card.id} />
							<div class="grid gap-4 md:grid-cols-2">
								<textarea
									name="term"
									required
									bind:value={editCardTerm}
									class="w-full rounded-xl border border-gray-300 bg-white p-3 font-bold text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
								></textarea>
								<textarea
									name="definition"
									required
									bind:value={editCardDef}
									class="w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
								></textarea>
							</div>
							<div class="mt-3 flex justify-end gap-2">
								<button
									type="button"
									onclick={() => (editCardId = null)}
									class="rounded-lg bg-gray-100 px-3 py-1 font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
									>Cancel</button
								>
								<button
									type="submit"
									class="rounded-lg bg-blue-500 px-3 py-1 font-bold text-white hover:bg-blue-600"
									>Save</button
								>
							</div>
						</form>
					{:else}
						<div class="flex flex-col gap-4 text-center">
							<div class="border-b border-gray-100 pb-4 dark:border-gray-800">
								<p
									class="text-3xl font-extrabold whitespace-pre-wrap text-gray-900 dark:text-gray-100"
								>
									{card.term}
								</p>
							</div>
							<div>
								<p class="text-xl whitespace-pre-wrap text-gray-700 dark:text-gray-300">
									{card.definition}
								</p>
							</div>
						</div>

						<div
							class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800"
						>
							<div class="flex items-center gap-3" title="Card Level">
								<div class="relative flex h-10 w-10 items-center justify-center">
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
										{#if card.fluencyScore !== null && card.fluencyScore !== undefined}
											{@const progress = card.fluencyScore % 100}
											{@const level = Math.floor(card.fluencyScore / 100)}
											<circle
												cx="18"
												cy="18"
												r="15"
												fill="none"
												class={level >= 3
													? 'stroke-green-500'
													: level >= 1
														? 'stroke-blue-500'
														: 'stroke-yellow-400'}
												stroke-width="4"
												stroke-dasharray="94.2"
												stroke-dashoffset={94.2 - (progress / 100) * 94.2}
												stroke-linecap="round"
												style="transition: stroke-dashoffset 1s ease-in-out;"
											></circle>
										{/if}
									</svg>
									<span
										class="relative text-[10px] font-bold {card.fluencyScore !== null &&
										card.fluencyScore !== undefined
											? 'text-gray-700 dark:text-gray-300'
											: 'text-gray-400 dark:text-gray-500'}"
									>
										Lv.{Math.floor((card.fluencyScore || 0) / 100)}
									</span>
								</div>
								<span
									class="text-sm font-bold {card.fluencyScore !== null &&
									card.fluencyScore !== undefined
										? 'text-gray-600 dark:text-gray-400'
										: 'text-gray-400 dark:text-gray-500'}">Level</span
								>
							</div>

							<div class="flex items-center gap-2">
								<button
									onclick={() => isOwner && startEditCard(card.id, card.term, card.definition)}
									disabled={!isOwner}
									class="rounded-lg px-4 py-2 text-sm font-bold transition {isOwner
										? 'text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400'
										: 'cursor-not-allowed text-gray-300 dark:text-gray-700'}">Edit</button
								>
								<form
									method="post"
									action="?/deleteFlashcard"
									use:enhance
									onsubmit={(e) => {
										if (!isOwner) {
											e.preventDefault();
											return;
										}
										if (!confirm('Delete this card?')) e.preventDefault();
									}}
								>
									<input type="hidden" name="id" value={card.id} />
									<button
										type="submit"
										disabled={!isOwner}
										class="rounded-lg px-4 py-2 text-sm font-bold transition {isOwner
											? 'text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400'
											: 'cursor-not-allowed text-gray-300 dark:text-gray-700'}">Delete</button
									>
								</form>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
