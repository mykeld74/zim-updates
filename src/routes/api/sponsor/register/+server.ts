import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { APIError } from 'better-auth';
import { normalizeEmail } from '$lib/server/sponsorAccount';

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const data = body as Record<string, unknown>;
	const name = typeof data.name === 'string' ? data.name.trim() : '';
	const email = typeof data.email === 'string' ? data.email.trim() : '';
	const password = typeof data.password === 'string' ? data.password : '';

	if (!name || !email || !password) {
		return json({ error: 'Name, email, and password are required' }, { status: 400 });
	}

	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
	}

	const callbackURL = new URL('/login?message=email-verified', request.url).href;

	try {
		await auth.api.signUpEmail({
			body: { name, email, password, callbackURL },
			headers: request.headers
		});
	} catch (err) {
		if (err instanceof APIError) {
			return json(
				{ error: err.message || 'Could not create account' },
				{ status: typeof err.status === 'number' ? err.status : 400 }
			);
		}
		console.error('sponsor register signUp:', err);
		return json({ error: 'Could not create account' }, { status: 500 });
	}

	const normalized = normalizeEmail(email);
	const userRows = await db
		.select()
		.from(userTable)
		.where(sql`lower(trim(${userTable.email})) = ${normalized}`)
		.limit(1);
	const row = userRows[0];
	if (!row) {
		return json({ error: 'Account created but user record was not found. Try signing in.' }, { status: 500 });
	}

	await db
		.update(userTable)
		.set({ sponsorPortalSignup: true, updatedAt: new Date() })
		.where(eq(userTable.id, row.id));

	return json({ ok: true, message: 'Check your email to verify your account.' });
};
