<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
	{#each toast.toasts as t (t.id)}
		<div
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ y: 20, duration: 300 }}
			class="pointer-events-auto flex items-center justify-between gap-4 rounded-xl px-4 py-3 font-bold text-white shadow-lg {t.type ===
			'success'
				? 'bg-green-500'
				: t.type === 'error'
					? 'bg-red-500'
					: 'bg-blue-500'}"
			role="alert"
		>
			<span>{t.message}</span>
			<button
				type="button"
				onclick={() => toast.remove(t.id)}
				class="text-white/80 hover:text-white"
				aria-label="Close"
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
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>
