<script lang="ts">
	import Tag from './Tag.svelte';

	let { tags = $bindable([]), suggestedTags = [] } = $props<{
		tags: string[];
		suggestedTags?: string[];
	}>();

	let inputValue = $state('');
	let showSuggestions = $state(false);

	let filteredSuggestions = $derived(
		suggestedTags
			.filter((t) => t.toLowerCase().includes(inputValue.toLowerCase()))
			.filter((t) => !tags.includes(t))
	);

	function addTag(tag: string) {
		const t = tag.trim().toLowerCase();
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
		}
		inputValue = '';
		showSuggestions = false;
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag(inputValue);
		} else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
			removeTag(tags[tags.length - 1]);
		} else if (e.key === 'Escape') {
			showSuggestions = false;
		}
	}
</script>

<div class="relative">
	<div
		class="mt-1 flex w-full flex-wrap items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
	>
		{#each tags as tag}
			<Tag name={tag} onremove={() => removeTag(tag)} />
		{/each}
		<input
			type="text"
			placeholder={tags.length === 0 ? 'Add tags (press Enter)...' : ''}
			bind:value={inputValue}
			onkeydown={onKeyDown}
			onfocus={() => (showSuggestions = true)}
			onblur={() => setTimeout(() => (showSuggestions = false), 150)}
			class="flex-1 border-0 bg-transparent p-0 font-medium text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100"
		/>
	</div>

	{#if showSuggestions && filteredSuggestions.length > 0}
		<div
			class="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<ul class="max-h-60 overflow-auto py-1">
				{#each filteredSuggestions as suggestion}
					<li>
						<button
							type="button"
							onclick={() => addTag(suggestion)}
							class="w-full px-4 py-2 text-left text-sm font-medium hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
						>
							<Tag name={suggestion} />
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
