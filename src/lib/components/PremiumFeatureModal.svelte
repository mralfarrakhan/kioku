<script lang="ts">
	let {
		title = 'Premium Feature',
		message = 'Private collections are not available right now. This feature is restricted to PREMIUM or ADMIN users.'
	} = $props<{
		title?: string;
		message?: string;
	}>();

	let dialog: HTMLDialogElement | undefined = $state();

	export function showModal() {
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
	}
</script>

<dialog
	bind:this={dialog}
	class="fixed inset-0 m-auto rounded-2xl border border-gray-200 p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900"
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<div
		class="w-full max-w-sm p-6"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="document"
	>
		<h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
		<p class="mb-6 text-gray-600 dark:text-gray-400">{message}</p>

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={close}
				class="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white transition hover:bg-blue-600"
			>
				Okay
			</button>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		animation: fade-in 0.2s ease-out;
	}
	dialog[open] {
		animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
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
