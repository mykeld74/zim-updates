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
		const fullUserRows = await db.select().from(userTable).where(eq(userTable.id, sessionData.user.id)).limit(1);
		const fullUser = fullUserRows[0];
		if (fullUser) {
			const normalizedEmail = fullUser.email.trim().toLowerCase();
			const role = adminEmails.has(normalizedEmail) ? 'admin' : ((fullUser.role ?? 'sponsor') as 'admin' | 'sponsor');
			if (fullUser.role !== role) {
				await db.update(userTable).set({ role, updatedAt: new Date() }).where(eq(userTable.id, fullUser.id));
			}
			const sponsorRows = await db
				.select({ id: sponsorTable.id })
				.from(sponsorTable)
				.where(eq(sponsorTable.userId, fullUser.id))
				.limit(1);
			event.locals.hasSponsorAccount = sponsorRows.length > 0;
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
