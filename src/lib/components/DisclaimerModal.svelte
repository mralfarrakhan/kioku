<script lang="ts">
	import { onMount } from 'svelte';

	let dialog: HTMLDialogElement | undefined = $state();
	let { hasAgreed } = $props<{ hasAgreed: boolean }>();

	let isVisible = $state(!hasAgreed);

	onMount(() => {
		if (isVisible) {
			dialog?.showModal();
		}
	});

	function handleAgree() {
		// Set cookie for 1 year
		document.cookie = `kioku_disclaimer_agreed=true; path=/; max-age=31536000; samesite=lax`;
		isVisible = false;
		dialog?.close();
	}
</script>

{#if isVisible}
	<dialog
		bind:this={dialog}
		class="fixed inset-0 m-auto rounded-2xl border border-gray-200 p-0 shadow-2xl backdrop:bg-gray-900/80 backdrop:backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900"
		oncancel={(e) => e.preventDefault()}
	>
		<div class="w-full max-w-md p-6 sm:p-8" role="document">
			<h3 class="mb-4 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
				Welcome to Kioku! 🧠
			</h3>

			<div class="mb-6 space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
				<p>
					Please be aware that this application is currently <strong>highly experimental</strong>.
					Features, layouts, and data structures are subject to rapid and sudden changes.
				</p>
				<p>
					We are constantly iterating to improve the experience, which means you might occasionally
					encounter bugs or unexpected behavior.
				</p>
				<p class="text-xs text-gray-500 dark:text-gray-500">
					By continuing to use this site, you acknowledge these terms and agree to our use of
					cookies necessary for essential functionality and preferences.
				</p>
			</div>

			<div class="flex flex-col gap-3">
				<button
					type="button"
					onclick={handleAgree}
					class="w-full rounded-xl bg-blue-500 px-5 py-3 font-bold text-white shadow-md transition hover:bg-blue-600 hover:shadow-lg active:translate-y-px active:shadow-sm"
				>
					I Understand & Agree
				</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	dialog::backdrop {
		animation: fade-in 0.3s ease-out forwards;
	}
	dialog[open] {
		animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			backdrop-filter: blur(0px);
		}
		to {
			opacity: 1;
			backdrop-filter: blur(4px);
		}
	}

	@keyframes scale-up {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
