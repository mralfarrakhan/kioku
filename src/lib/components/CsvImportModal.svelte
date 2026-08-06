<script lang="ts">
	import { enhance } from '$app/forms';
	import Papa from 'papaparse';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';

	let dialog: HTMLDialogElement | undefined = $state();
	let fileInput: HTMLInputElement | undefined = $state();

	let file: File | null = $state(null);
	let step: 'upload' | 'validating' | 'summary' | 'importing' = $state('upload');

	let parsedRowsJson = $state('[]');
	let validRowsJson = $state('[]');

	let validRows: any[] = $state([]);
	let skippedTerms: string[] = $state([]);
	let errors: { row: number; message: string }[] = $state([]);
	let newTags: string[] = $state([]);
	let existingTags: string[] = $state([]);

	let errorMsg: string | null = $state(null);
	let validateFormBtn: HTMLButtonElement | undefined = $state();

	export function showModal() {
		reset();
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
	}

	function reset() {
		file = null;
		if (fileInput) fileInput.value = '';
		step = 'upload';
		errorMsg = null;
		parsedRowsJson = '[]';
		validRowsJson = '[]';
		validRows = [];
		skippedTerms = [];
		errors = [];
		newTags = [];
		existingTags = [];
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
			errorMsg = null;
		}
	}

	function parseFile() {
		if (!file) return;
		step = 'validating';

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const rows = results.data as any[];

				if (
					!results.meta.fields ||
					!results.meta.fields.includes('term') ||
					!results.meta.fields.includes('definition') ||
					!results.meta.fields.includes('tags')
				) {
					errorMsg = 'Invalid CSV format. Header must contain "term", "definition", and "tags".';
					step = 'upload';
					return;
				}

				if (rows.length === 0) {
					errorMsg = 'No valid rows found in CSV.';
					step = 'upload';
					return;
				}

				parsedRowsJson = JSON.stringify(rows);
				// Small delay to let Svelte update the DOM before submitting the hidden form
				setTimeout(() => {
					validateFormBtn?.click();
				}, 0);
			},
			error: (err) => {
				errorMsg = 'Failed to parse CSV: ' + err.message;
				step = 'upload';
			}
		});
	}

	const handleValidateSubmit: SubmitFunction = () => {
		return async ({ result }) => {
			if (result.type === 'success' && result.data) {
				validRows = (result.data.validRows as any[]) || [];
				validRowsJson = JSON.stringify(validRows);
				skippedTerms = (result.data.skippedTerms as string[]) || [];
				errors = (result.data.errors as any[]) || [];
				newTags = (result.data.newTags as string[]) || [];
				existingTags = (result.data.existingTags as string[]) || [];
				step = 'summary';
			} else if (result.type === 'failure') {
				errorMsg = (result.data?.message as string) || 'Validation failed.';
				step = 'upload';
			} else {
				errorMsg = 'Unexpected server response.';
				step = 'upload';
			}
		};
	};

	const handleImportSubmit: SubmitFunction = () => {
		step = 'importing';
		return async ({ result }) => {
			if (result.type === 'success') {
				await invalidateAll();
				close();
			} else if (result.type === 'failure') {
				errorMsg = (result.data?.message as string) || 'Import failed.';
				step = 'summary';
			} else {
				errorMsg = 'Unexpected server response.';
				step = 'summary';
			}
		};
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="m-auto rounded-2xl p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:bg-gray-900"
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="w-full max-w-2xl p-6" onclick={(e) => e.stopPropagation()}>
		<h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
			Import Flashcards via CSV
		</h2>

		{#if errorMsg}
			<div
				class="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400"
			>
				{errorMsg}
			</div>
		{/if}

		{#if step === 'upload'}
			<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				<p class="mb-2">Upload a CSV file containing your flashcards. The first row must be a header with exact names: <code class="rounded bg-gray-100 px-1 font-mono text-xs dark:bg-gray-800">term,definition,tags</code>.</p>
				<ul class="ml-4 list-disc space-y-1 text-xs">
					<li><strong>term:</strong> The front of the flashcard.</li>
					<li><strong>definition:</strong> The back of the flashcard.</li>
					<li><strong>tags:</strong> (Optional) Categorize your cards. Multiple tags must be comma-separated and wrapped in quotes (e.g., <code class="rounded bg-gray-100 px-1 font-mono dark:bg-gray-800">"verb, noun"</code>). Max 20 tags per card, 16 chars per tag.</li>
				</ul>
			</div>

			<div
				class="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700"
			>
				<input
					type="file"
					accept=".csv"
					bind:this={fileInput}
					onchange={handleFileSelect}
					class="hidden"
					id="csv-upload"
				/>
				<label
					for="csv-upload"
					class="cursor-pointer rounded-xl bg-blue-50 px-6 py-3 font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
				>
					Select CSV File
				</label>
				{#if file}
					<div class="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
						{file.name} ({(file.size / 1024).toFixed(1)} KB)
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={close}
					class="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>Cancel</button
				>
				<button
					type="button"
					onclick={parseFile}
					disabled={!file}
					class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
					>Continue</button
				>
			</div>
		{:else if step === 'validating'}
			<div class="flex flex-col items-center justify-center py-12">
				<div
					class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
				></div>
				<p class="font-bold text-gray-600 dark:text-gray-400">Validating rows...</p>
			</div>
		{:else if step === 'summary'}
			<div class="mb-6">
				<p class="mb-4 text-gray-600 dark:text-gray-400">Here is the summary of your import:</p>
				<div class="mb-6 grid grid-cols-4 gap-4 text-center">
					<div class="rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
						<div class="text-2xl font-black text-green-600 dark:text-green-400">
							{validRows.length}
						</div>
						<div class="text-xs font-bold tracking-wide uppercase text-green-700 dark:text-green-500">
							Valid
						</div>
					</div>
					<div class="rounded-xl bg-yellow-50 p-3 dark:bg-yellow-900/20">
						<div class="text-2xl font-black text-yellow-600 dark:text-yellow-400">
							{skippedTerms.length}
						</div>
						<div class="text-xs font-bold tracking-wide uppercase text-yellow-700 dark:text-yellow-500">
							Skipped
						</div>
					</div>
					<div class="rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
						<div class="text-2xl font-black text-red-600 dark:text-red-400">
							{errors.length}
						</div>
						<div class="text-xs font-bold tracking-wide uppercase text-red-700 dark:text-red-500">
							Errors
						</div>
					</div>
					<div class="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
						<div class="text-2xl font-black text-blue-600 dark:text-blue-400">
							{newTags.length + existingTags.length}
						</div>
						<div class="text-xs font-bold tracking-wide uppercase text-blue-700 dark:text-blue-500">
							Tags
						</div>
					</div>
				</div>

				<div class="flex max-h-72 flex-col gap-4 overflow-y-auto pr-2">
					{#if errors.length > 0}
						<div>
							<h3 class="mb-2 font-bold text-red-600 dark:text-red-400">Errors ({errors.length})</h3>
							<div class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
								<ul class="flex flex-col gap-2 text-sm text-red-700 dark:text-red-400">
									{#each errors as error}
										<li><span class="font-bold">Row {error.row}:</span> {error.message}</li>
									{/each}
								</ul>
								<p class="mt-3 text-xs text-red-600/70 dark:text-red-400/70">These rows will not be imported.</p>
							</div>
						</div>
					{/if}

					{#if skippedTerms.length > 0}
						<div>
							<h3 class="mb-2 font-bold text-yellow-600 dark:text-yellow-400">Skipped (Duplicates) ({skippedTerms.length})</h3>
							<div class="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/10">
								<p class="mb-2 text-sm text-yellow-700 dark:text-yellow-400">These terms already exist in the collection:</p>
								<div class="flex flex-wrap gap-1.5">
									{#each skippedTerms as term}
										<span class="rounded bg-yellow-200/50 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">{term}</span>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					{#if newTags.length > 0 || existingTags.length > 0}
						<div>
							<h3 class="mb-2 font-bold text-blue-600 dark:text-blue-400">Tags Found ({newTags.length + existingTags.length})</h3>
							<div class="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
								<div class="flex flex-wrap gap-1.5">
									{#each newTags as tag}
										<span title="This is a brand new tag" class="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white shadow-sm dark:bg-blue-600">
											{tag} <span class="ml-0.5 uppercase tracking-wider text-[10px] opacity-75">(New)</span>
										</span>
									{/each}
									{#each existingTags as tag}
										<span title="This tag already exists in the collection" class="rounded bg-gray-200/70 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
											{tag}
										</span>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					{#if validRows.length > 0}
						<div>
							<h3 class="mb-2 font-bold text-green-600 dark:text-green-400">Ready to Import ({validRows.length})</h3>
							<div class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
								<ul class="flex max-h-40 flex-col gap-2 overflow-y-auto text-sm text-green-800 dark:text-green-300">
									{#each validRows as row}
										<li><span class="font-bold">{row.term}</span> - <span class="truncate opacity-75">{row.definition}</span></li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<form
				method="post"
				action="?/importCsv"
				use:enhance={handleImportSubmit}
				class="flex justify-end gap-3 mt-4"
			>
				<input type="hidden" name="validRows" value={validRowsJson} />
				<button
					type="button"
					onclick={() => (step = 'upload')}
					class="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>Back</button
				>
				<button
					type="submit"
					disabled={validRows.length === 0}
					class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
					>Confirm Import</button
				>
			</form>
		{:else if step === 'importing'}
			<div class="flex flex-col items-center justify-center py-12">
				<div
					class="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
				></div>
				<p class="font-bold text-gray-600 dark:text-gray-400">Importing flashcards...</p>
			</div>
		{/if}

		<!-- Hidden form for validation -->
		<form method="post" action="?/validateCsv" use:enhance={handleValidateSubmit} class="hidden">
			<input type="hidden" name="rows" value={parsedRowsJson} />
			<button type="submit" bind:this={validateFormBtn}>Validate</button>
		</form>
	</div>
</dialog>
