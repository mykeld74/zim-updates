import { auth, svelteKitHandler } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { user as userTable, sponsor as sponsorTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const adminEmails = new Set(['mike@msdweb.pro']);

const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const guardHandler: Handle = async ({ event, resolve }) => {
	const sessionData = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = sessionData?.session ?? null;
	event.locals.hasSponsorAccount = false;

	if (sessionData?.user) {
		// Single roundtrip: fetch the user and whether they have a linked sponsor row.
		// The Neon HTTP driver issues one request per query, so the join avoids a second roundtrip.
		const rows = await db
			.select({ user: userTable, sponsorId: sponsorTable.id })
			.from(userTable)
			.leftJoin(sponsorTable, eq(sponsorTable.userId, userTable.id))
			.where(eq(userTable.id, sessionData.user.id))
			.limit(1);
		const fullUser = rows[0]?.user;
		if (fullUser) {
			const normalizedEmail = fullUser.email.trim().toLowerCase();
			const role = adminEmails.has(normalizedEmail)
				? 'admin'
				: ((fullUser.role ?? 'sponsor') as 'admin' | 'sponsor');
			if (fullUser.role !== role) {
				await db
					.update(userTable)
					.set({ role, updatedAt: new Date() })
					.where(eq(userTable.id, fullUser.id));
			}
			event.locals.hasSponsorAccount = rows[0]?.sponsorId != null;
			event.locals.user = {
				...sessionData.user,
				role,
				approved: role === 'admin',
				emailVerified: fullUser.emailVerified,
				sponsorPortalSignup: fullUser.sponsorPortalSignup
			};
		} else {
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	// Protect admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!sessionData) {
			throw redirect(303, '/login');
		}

		if (event.locals.user?.role !== 'admin') {
			throw redirect(303, '/login?message=pending');
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandler, guardHandler);
