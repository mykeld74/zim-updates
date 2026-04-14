import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getUpdateById,
	updateUpdate,
	deleteUpdate,
	publishUpdate,
	unpublishUpdate
} from '$lib/server/updates';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function requireApprovedUser(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const currentUser = await db.query.user.findFirst({
		where: eq(userTable.id, locals.user.id)
	});

	if (!currentUser || currentUser.role !== 'admin') {
		throw error(403, 'Forbidden: Account not authorized');
	}

	return currentUser;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		const update = await getUpdateById(params.id);

		if (!update) {
			return json({ error: 'Update not found' }, { status: 404 });
		}

		return json({ update });
	} catch (err) {
		console.error('Error fetching update:', err);
		return json({ error: 'Failed to fetch update' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		const update = await updateUpdate(params.id, {
			title: data.title,
			slug: data.slug,
			excerpt: data.excerpt,
			content: data.content,
			layout: data.layout,
			featuredImage: data.featuredImage,
			author: data.author,
			status: data.status
		});

		if (!update) {
			return json({ error: 'Update not found' }, { status: 404 });
		}

		return json({ update });
	} catch (err) {
		console.error('Error updating update:', err);

		// Check for unique constraint violation (duplicate slug)
		if (err instanceof Error && err.message.includes('unique')) {
			return json({ error: 'An update with this slug already exists' }, { status: 400 });
		}

		return json({ error: 'Failed to update' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		const success = await deleteUpdate(params.id);

		if (!success) {
			return json({ error: 'Update not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting update:', err);
		return json({ error: 'Failed to delete update' }, { status: 500 });
	}
};

// Additional action endpoints
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		let update;
		if (data.action === 'publish') {
			update = await publishUpdate(params.id);
		} else if (data.action === 'unpublish') {
			update = await unpublishUpdate(params.id);
		} else {
			return json({ error: 'Invalid action' }, { status: 400 });
		}

		if (!update) {
			return json({ error: 'Update not found' }, { status: 404 });
		}

		return json({ update });
	} catch (err) {
		console.error('Error updating status:', err);
		return json({ error: 'Failed to update status' }, { status: 500 });
	}
};
