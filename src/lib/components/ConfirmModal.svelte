<script lang="ts">
	let {
		title = 'Are you sure?',
		message = 'This action cannot be undone.',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmStyle = 'danger',
		onconfirm,
		oncancel
	} = $props<{
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmStyle?: 'danger' | 'primary';
		onconfirm: () => void;
		oncancel?: () => void;
	}>();

	let dialog: HTMLDialogElement | undefined = $state();

	export function showModal() {
		dialog?.showModal();
	}

	export function close() {
		dialog?.close();
		if (oncancel) oncancel();
	}

	let isLoading = $state(false);

	async function handleConfirm() {
		isLoading = true;
		const result = onconfirm();
		if (result instanceof Promise) {
			await result;
		}
		isLoading = false;
		dialog?.close();
	}
</script>

<dialog
	bind:this={dialog}
	class="fixed inset-0 m-auto rounded-2xl border border-gray-200 p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900"
	onclick={(e) => {
		if (e.target === dialog && !isLoading) close();
	}}
	onclose={() => {
		if (oncancel && !isLoading) oncancel();
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
				disabled={isLoading}
				class="rounded-xl px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
			>
				{cancelText}
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				disabled={isLoading}
				class="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-bold text-white transition {confirmStyle === 'danger'
					? 'bg-red-500 hover:bg-red-600'
					: 'bg-blue-500 hover:bg-blue-600'} disabled:opacity-70 disabled:cursor-not-allowed"
			>
				{#if isLoading}
					<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
				{/if}
				{confirmText}
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
