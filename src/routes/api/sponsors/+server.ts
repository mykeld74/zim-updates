import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllSponsors, createSponsor } from '$lib/server/sponsors';

export const GET: RequestHandler = async () => {
	try {
		const sponsors = await getAllSponsors();
		return json({ sponsors });
	} catch (error) {
		console.error('Error fetching sponsors:', error);
		return json({ error: 'Failed to fetch sponsors' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
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
