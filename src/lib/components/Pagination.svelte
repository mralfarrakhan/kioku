<script lang="ts">
	import { page } from '$app/state';

	let { currentPage, totalPages }: { currentPage: number; totalPages: number } = $props();

	function getPageUrl(pageNum: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', pageNum.toString());
		// Return just the pathname + search to avoid full page reloads if we were to return absolute url
		return url.pathname + url.search;
	}

	let pages = $derived.by(() => {
		let p = [];
		for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
			p.push(i);
		}
		return p;
	});
</script>

{#if totalPages > 1}
	<div class="mt-8 flex items-center justify-center gap-1 sm:gap-2">
		<a
			href={currentPage > 1 ? getPageUrl(currentPage - 1) : null}
			class="rounded-lg px-3 py-2 text-sm font-bold transition {currentPage > 1
				? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
				: 'pointer-events-none text-gray-300 dark:text-gray-700'}"
			aria-disabled={currentPage <= 1}
		>
			Previous
		</a>

		{#if pages[0] > 1}
			<a
				href={getPageUrl(1)}
				class="rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
				>1</a
			>
			{#if pages[0] > 2}
				<span class="px-1 text-gray-400 dark:text-gray-600">...</span>
			{/if}
		{/if}

		{#each pages as p}
			<a
				href={getPageUrl(p)}
				class="rounded-lg px-3 py-2 text-sm font-bold transition {currentPage === p
					? 'bg-blue-500 text-white shadow-sm'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
				aria-current={currentPage === p ? 'page' : undefined}
			>
				{p}
			</a>
		{/each}

		{#if pages[pages.length - 1] < totalPages}
			{#if pages[pages.length - 1] < totalPages - 1}
				<span class="px-1 text-gray-400 dark:text-gray-600">...</span>
			{/if}
			<a
				href={getPageUrl(totalPages)}
				class="rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
				>{totalPages}</a
			>
		{/if}

		<a
			href={currentPage < totalPages ? getPageUrl(currentPage + 1) : null}
			class="rounded-lg px-3 py-2 text-sm font-bold transition {currentPage < totalPages
				? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
				: 'pointer-events-none text-gray-300 dark:text-gray-700'}"
			aria-disabled={currentPage >= totalPages}
		>
			Next
		</a>
	</div>
{/if}
