import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { account, session, user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function requireAuthorizedAdmin(locals: App.Locals) {
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
}

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	await requireAuthorizedAdmin(locals);
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

export const DELETE: RequestHandler = async ({ params, locals }) => {
	await requireAuthorizedAdmin(locals);

	const { id } = params;
	if (id === locals.user?.id) {
		throw error(400, 'You cannot delete your own account');
	}

	try {
		await db.delete(session).where(eq(session.userId, id));
		await db.delete(account).where(eq(account.userId, id));
		const deletedUsers = await db.delete(userTable).where(eq(userTable.id, id)).returning({ id: userTable.id });
		if (deletedUsers.length === 0) {
			throw error(404, 'User not found');
		}
		return json({ success: true });
	} catch (err) {
		console.error('Error deleting user:', err);
		throw error(500, 'Failed to delete user');
	}
};

