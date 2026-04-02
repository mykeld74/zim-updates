import { auth, svelteKitHandler } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const guardHandler: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	event.locals.user = sessionData?.user ? { ...sessionData.user, approved: false } : null;

	// Protect admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!sessionData) {
			throw redirect(303, '/login');
		}

		// Check if user is approved
		if (sessionData.user) {
			const fullUser = await db.query.user.findFirst({
				where: eq(userTable.id, sessionData.user.id)
			});

			if (!fullUser?.approved) {
				throw redirect(303, '/login?message=pending');
			}

			// Update locals.user with approved status
			event.locals.user = {
				...sessionData.user,
				approved: fullUser.approved
			};
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandler, guardHandler);
