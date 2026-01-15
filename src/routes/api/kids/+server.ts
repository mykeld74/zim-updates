import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllKids, createKid } from '$lib/server/sponsors';
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

	if (!currentUser?.approved) {
		throw error(403, 'Forbidden: Account not approved');
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	await requireApprovedUser(locals);

	try {
		const kids = await getAllKids();
		return json({ kids });
	} catch (err) {
		console.error('Error fetching kids:', err);
		return json({ error: 'Failed to fetch kids' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.name) {
			return json({ error: 'Missing required field: name' }, { status: 400 });
		}

		const kid = await createKid({
			name: data.name,
			birthday: data.birthday ? new Date(data.birthday) : undefined,
			gender: data.gender,
			image: data.image,
			sponsorIds: data.sponsorIds || []
		});

		return json({ kid }, { status: 201 });
	} catch (error) {
		console.error('Error creating kid:', error);
		return json({ error: 'Failed to create kid' }, { status: 500 });
	}
};
