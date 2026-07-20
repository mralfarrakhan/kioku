import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleSetupAndRateLimit: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	if (!event.platform?.env?.DB)
		throw new Error('D1 binding "DB" not found - are you running with wrangler?');

	event.locals.auth = createAuth(event.platform.env.DB);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	// Rate limiting logic
	const isDataMutation = ['POST', 'PUT', 'DELETE'].includes(event.request.method);
	const isApiRoute = event.url.pathname.startsWith('/api/');
	const isRateLimitedPage = event.url.pathname === '/rate-limited';

	if ((isDataMutation || isApiRoute) && !isRateLimitedPage) {
		const rateLimiter = event.platform?.env?.RATE_LIMITER;
		if (rateLimiter) {
			const key = event.locals.user?.id || event.getClientAddress() || 'unknown';
			const { success } = await rateLimiter.limit({ key });

			if (!success) {
				return new Response(null, {
					status: 302,
					headers: { location: '/rate-limited' }
				});
			}
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleSetupAndRateLimit;
