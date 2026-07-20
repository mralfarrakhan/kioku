<script lang="ts">
	import { onMount } from 'svelte';

	let countdown = $state(60);

	onMount(() => {
		const interval = setInterval(() => {
			if (countdown > 0) {
				countdown--;
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
	<div
		class="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-lg"
	>
		<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="h-8 w-8 text-red-500"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>

		<h1 class="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
			Whoa there, speedy!
		</h1>

		<p class="mb-6 text-gray-600 dark:text-gray-300">
			You've hit our rate limit. Take a quick breather and you'll be able to continue in just a
			moment.
		</p>

		<div class="mb-8 flex flex-col items-center justify-center gap-2">
			<div class="font-mono text-4xl font-bold text-indigo-500 dark:text-indigo-400">
				00:{countdown.toString().padStart(2, '0')}
			</div>
			<div class="text-sm tracking-wider text-gray-500 uppercase">Seconds Remaining</div>
		</div>

		<button
			onclick={() => (window.location.href = '/')}
			class="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
		>
			Return to Homepage
		</button>
	</div>
</div>
