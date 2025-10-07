import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	event.locals.user = sessionData?.user ?? null;

	// Protect admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!sessionData) {
			throw redirect(303, '/login');
		}
	}

	return resolve(event);
};
