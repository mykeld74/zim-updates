import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is approved by querying database
	const currentUser = await db.query.user.findFirst({
		where: eq(userTable.id, locals.user.id)
	});

	if (!currentUser || currentUser.role !== 'admin') {
		throw error(403, 'Forbidden: Account not authorized');
	}

	try {
		const users = await db.query.user.findMany({
			orderBy: (users, { desc }) => [desc(users.createdAt)]
		});

		return json({ users });
	} catch (err) {
		console.error('Error fetching users:', err);
		throw error(500, 'Failed to fetch users');
	}
};

