import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Check if user is approved by querying database
	// (hooks.server.ts should handle this, but we double-check here)
	const currentUser = await db.query.user.findFirst({
		where: eq(userTable.id, locals.user.id)
	});

	if (!currentUser || currentUser.role !== 'admin') {
		throw redirect(303, '/login?message=pending');
	}

	try {
		const users = await db.query.user.findMany({
			orderBy: (users, { desc }) => [desc(users.createdAt)]
		});

		return {
			users
		};
	} catch (err) {
		console.error('Error loading users:', err);
		throw error(500, 'Failed to load users');
	}
};

