import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSponsorById, updateSponsor, deleteSponsor } from '$lib/server/sponsors';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const sponsor = await getSponsorById(params.id);

		if (!sponsor) {
			return json({ error: 'Sponsor not found' }, { status: 404 });
		}

		return json({ sponsor });
	} catch (error) {
		console.error('Error fetching sponsor:', error);
		return json({ error: 'Failed to fetch sponsor' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
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
	} catch (error) {
		console.error('Error updating sponsor:', error);
		return json({ error: 'Failed to update sponsor' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteSponsor(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting sponsor:', error);
		return json({ error: 'Failed to delete sponsor' }, { status: 500 });
	}
};
