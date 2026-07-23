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

	function handleConfirm() {
		dialog?.close();
		onconfirm();
	}
</script>

<dialog
	bind:this={dialog}
	class="fixed inset-0 m-auto rounded-2xl border border-gray-200 p-0 shadow-2xl backdrop:bg-gray-900/50 backdrop:backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900"
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
	onclose={() => {
		if (oncancel) oncancel();
	}}
>
	<div class="w-full max-w-sm p-6" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="document">
		<h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
		<p class="mb-6 text-gray-600 dark:text-gray-400">{message}</p>
		
		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={close}
				class="rounded-xl px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
			>
				{cancelText}
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				class="rounded-xl px-4 py-2 font-bold text-white transition {confirmStyle === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}"
			>
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
