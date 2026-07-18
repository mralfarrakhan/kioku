<script lang="ts">
	import { onMount } from 'svelte';

	let isDark = $state(false);
	let { variant = 'desktop' }: { variant?: 'desktop' | 'mobile' } = $props();

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.theme = 'dark';
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.theme = 'light';
		}
	}
</script>

{#if variant === 'desktop'}
	<button
		onclick={toggleTheme}
		class="flex w-full items-center gap-3 rounded-xl bg-gray-100 p-3 text-left font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
	>
		{#if isDark}
			<span>🌞 Light Mode</span>
		{:else}
			<span>🌙 Dark Mode</span>
		{/if}
	</button>
{:else}
	<button
		onclick={toggleTheme}
		class="flex flex-col items-center gap-1 rounded-xl p-2 text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
	>
		{#if isDark}
			<span class="text-xl">🌞</span>
		{:else}
			<span class="text-xl">🌙</span>
		{/if}
		<span class="text-xs font-semibold">Theme</span>
	</button>
{/if}
