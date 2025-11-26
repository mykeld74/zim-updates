import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is approved by querying database
	const currentUser = await db.query.user.findFirst({
		where: eq(userTable.id, locals.user.id)
	});

	if (!currentUser?.approved) {
		throw error(403, 'Forbidden: Account not approved');
	}

	const { id } = params;
	const { approved } = await request.json();

	if (typeof approved !== 'boolean') {
		throw error(400, 'Invalid request body');
	}

	try {
		const updatedUser = await db
			.update(userTable)
			.set({ approved, updatedAt: new Date() })
			.where(eq(userTable.id, id))
			.returning();

		if (updatedUser.length === 0) {
			throw error(404, 'User not found');
		}

		return json({ success: true, user: updatedUser[0] });
	} catch (err) {
		console.error('Error updating user:', err);
		throw error(500, 'Failed to update user');
	}
};

