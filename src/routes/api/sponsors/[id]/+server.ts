import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSponsorById, updateSponsor, deleteSponsor } from '$lib/server/sponsors';
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

export const GET: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		const sponsor = await getSponsorById(params.id);

		if (!sponsor) {
			return json({ error: 'Sponsor not found' }, { status: 404 });
		}

		return json({ sponsor });
	} catch (err) {
		console.error('Error fetching sponsor:', err);
		return json({ error: 'Failed to fetch sponsor' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		const sponsor = await updateSponsor(params.id, {
			firstName: data.firstName,
			lastName: data.lastName,
			phoneNumber: data.phoneNumber,
			email: data.email,
			sponsorshipType: data.sponsorshipType,
			kidIds: data.kidIds
		});

		if (!sponsor) {
			return json({ error: 'Sponsor not found' }, { status: 404 });
		}

		return json({ sponsor });
	} catch (err) {
		console.error('Error updating sponsor:', err);
		return json({ error: 'Failed to update sponsor' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		await deleteSponsor(params.id);
		return json({ success: true });
	} catch (err) {
		console.error('Error deleting sponsor:', err);
		return json({ error: 'Failed to delete sponsor' }, { status: 500 });
	}
};
