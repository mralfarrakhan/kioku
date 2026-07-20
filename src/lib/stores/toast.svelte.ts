export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

let toasts = $state<Toast[]>([]);

export const toast = {
	get toasts() {
		return toasts;
	},
	add(message: string, type: ToastType = 'info', duration: number = 3000) {
		const id = crypto.randomUUID();
		toasts.push({ id, message, type });
		setTimeout(() => {
			this.remove(id);
		}, duration);
	},
	success(message: string, duration?: number) {
		this.add(message, 'success', duration);
	},
	error(message: string, duration?: number) {
		this.add(message, 'error', duration);
	},
	remove(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}
};
