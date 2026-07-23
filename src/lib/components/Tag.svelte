<script lang="ts">
	import { stringToColor } from '$lib/color';

	let { name, onremove } = $props<{ name: string; onremove?: () => void }>();

	let tagColor = $derived(stringToColor(name));
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-gray-900 shadow-sm"
	style="background-color: {tagColor};"
>
	{name}
	{#if onremove}
		<button
			type="button"
			onclick={onremove}
			class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/20 focus:bg-black/20 focus:outline-none"
			aria-label="Remove tag"
		>
			<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</span>
