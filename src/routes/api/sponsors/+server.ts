import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllSponsors, createSponsor } from '$lib/server/sponsors';
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
}

export const GET: RequestHandler = async ({ locals }) => {
	await requireApprovedUser(locals);

	try {
		const sponsors = await getAllSponsors();
		return json({ sponsors });
	} catch (err) {
		console.error('Error fetching sponsors:', err);
		return json({ error: 'Failed to fetch sponsors' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.firstName || !data.lastName || !data.phoneNumber || !data.email) {
			return json(
				{ error: 'Missing required fields: firstName, lastName, phoneNumber, email' },
				{ status: 400 }
			);
		}

		const sponsor = await createSponsor({
			firstName: data.firstName,
			lastName: data.lastName,
			phoneNumber: data.phoneNumber,
			email: data.email,
			sponsorshipType: data.sponsorshipType,
			kidIds: data.kidIds || []
		});

		return json({ sponsor }, { status: 201 });
	} catch (error) {
		console.error('Error creating sponsor:', error);
		return json({ error: 'Failed to create sponsor' }, { status: 500 });
	}
};
