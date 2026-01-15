import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	// Set initial user without approved status (will be set later if needed)
	event.locals.user = sessionData?.user
		? { ...sessionData.user, approved: false }
		: null;

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
