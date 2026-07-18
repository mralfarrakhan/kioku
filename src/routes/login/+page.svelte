<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let isRegistering = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-md rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-sm">
		<div class="mb-8 text-center">
			<h1 class="text-4xl font-extrabold tracking-tight text-blue-600">Kioku</h1>
			<p class="mt-2 text-lg font-medium text-gray-500">
				{#if isRegistering}
					Create an account to start learning
				{:else}
					Welcome back! Ready to review?
				{/if}
			</p>
		</div>

		{#if form?.message}
			<div class="mb-6 rounded-xl bg-red-50 p-4 text-center font-bold text-red-600">
				{form.message}
			</div>
		{/if}

		<form
			method="post"
			action={isRegistering ? '?/signUpEmail' : '?/signInEmail'}
			use:enhance
			class="flex flex-col gap-5"
		>
			<div>
				<label class="block text-sm font-bold text-gray-700">Email Address</label>
				<input
					type="email"
					name="email"
					required
					class="mt-1 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none"
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label class="block text-sm font-bold text-gray-700">Password</label>
				<input
					type="password"
					name="password"
					required
					class="mt-1 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none"
					placeholder="••••••••"
				/>
			</div>

			{#if isRegistering}
				<div>
					<label class="block text-sm font-bold text-gray-700">Full Name</label>
					<input
						type="text"
						name="name"
						required
						class="mt-1 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-900 transition focus:border-blue-500 focus:bg-white focus:outline-none"
						placeholder="What should we call you?"
					/>
				</div>
			{/if}

			<button
				type="submit"
				class="mt-2 w-full rounded-2xl bg-blue-500 py-4 text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-600 active:translate-y-0"
			>
				{isRegistering ? 'Create Account' : 'Log In'}
			</button>
		</form>

		<div class="mt-8 border-t border-gray-100 pt-6 text-center">
			<p class="font-medium text-gray-500">
				{#if isRegistering}
					Already have an account?
					<button
						class="font-bold text-blue-600 hover:underline focus:outline-none"
						onclick={() => (isRegistering = false)}
					>
						Log In
					</button>
				{:else}
					Don't have an account?
					<button
						class="font-bold text-blue-600 hover:underline focus:outline-none"
						onclick={() => (isRegistering = true)}
					>
						Sign Up
					</button>
				{/if}
			</p>
		</div>
	</div>
</div>
