import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllUpdates, createUpdate } from '$lib/server/updates';
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

export const GET: RequestHandler = async ({ locals }) => {
	await requireApprovedUser(locals);

	try {
		const updates = await getAllUpdates();
		return json({ updates });
	} catch (err) {
		console.error('Error fetching updates:', err);
		return json({ error: 'Failed to fetch updates' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const currentUser = await requireApprovedUser(locals);

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.title) {
			return json({ error: 'Missing required field: title' }, { status: 400 });
		}

		const update = await createUpdate({
			title: data.title,
			slug: data.slug,
			excerpt: data.excerpt,
			content: data.content,
			layout: data.layout,
			featuredImage: data.featuredImage,
			author: data.author || currentUser.name || 'Admin',
			status: data.status || 'draft'
		});

		return json({ update }, { status: 201 });
	} catch (err) {
		console.error('Error creating update:', err);

		// Check for unique constraint violation (duplicate slug)
		if (err instanceof Error && err.message.includes('unique')) {
			return json({ error: 'An update with this slug already exists' }, { status: 400 });
		}

		return json({ error: 'Failed to create update' }, { status: 500 });
	}
};
