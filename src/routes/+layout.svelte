<script lang="ts">
	import './layout.css';
	import type { LayoutServerData } from './$types';
	import { page } from '$app/state';

	let { data, children }: { data: LayoutServerData; children: import('svelte').Snippet } = $props();
</script>

{#if data.user}
	<div class="flex h-screen w-full flex-col bg-gray-50 text-gray-900 md:flex-row">
		<!-- Desktop Sidebar -->
		<aside class="hidden w-64 flex-col border-r border-gray-200 bg-white p-6 md:flex">
			<div class="mb-8 flex items-center gap-2 text-2xl font-bold text-blue-600">
				<span>Kioku</span>
			</div>

			<nav class="flex flex-1 flex-col gap-2">
				<a
					href="/"
					class="flex items-center gap-3 rounded-xl p-3 text-lg font-semibold transition hover:bg-gray-100 {page
						.url.pathname === '/'
						? 'bg-blue-50 text-blue-600'
						: 'text-gray-600'}"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
							points="9 22 9 12 15 12 15 22"
						/></svg
					>
					Home
				</a>
			</nav>

			<div class="mt-auto border-t border-gray-200 pt-4">
				<div class="mb-4 flex items-center gap-3 px-3">
					{#if data.user.image}
						<img
							src={data.user.image}
							alt={data.user.name}
							class="h-10 w-10 rounded-full bg-gray-200"
						/>
					{:else}
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600"
						>
							{data.user.name.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="flex flex-col">
						<span class="font-bold text-gray-800">{data.user.name}</span>
					</div>
				</div>
				<form method="post" action="/?/signOut">
					<button
						class="w-full rounded-xl bg-gray-100 p-3 text-left font-semibold text-gray-700 transition hover:bg-gray-200"
					>
						Sign Out
					</button>
				</form>
			</div>
		</aside>

		<!-- Main Content Area -->
		<main class="flex-1 overflow-y-auto pb-20 md:pb-0">
			<div class="mx-auto max-w-4xl p-4 md:p-8">
				{@render children()}
			</div>
		</main>

		<!-- Mobile Bottom Bar -->
		<nav
			class="pb-safe fixed bottom-0 z-50 flex w-full justify-around border-t border-gray-200 bg-white p-3 md:hidden"
		>
			<a
				href="/"
				class="flex flex-col items-center gap-1 rounded-xl p-2 transition {page.url.pathname === '/'
					? 'text-blue-600'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
						points="9 22 9 12 15 12 15 22"
					/></svg
				>
				<span class="text-xs font-semibold">Home</span>
			</a>

			<form method="post" action="/?/signOut" class="flex flex-col items-center">
				<button
					class="flex flex-col items-center gap-1 rounded-xl p-2 text-gray-500 transition hover:text-gray-900"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
							points="16 17 21 12 16 7"
						/><line x1="21" x2="9" y1="12" y2="12" /></svg
					>
					<span class="text-xs font-semibold">Logout</span>
				</button>
			</form>
		</nav>
	</div>
{:else}
	{@render children()}
{/if}
