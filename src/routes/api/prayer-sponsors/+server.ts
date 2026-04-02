import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSponsor, getKidById } from '$lib/server/sponsors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
		const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
		const email = typeof data.email === 'string' ? data.email.trim() : '';
		const phoneNumber = typeof data.phoneNumber === 'string' ? data.phoneNumber.trim() : '';
		const kidId = typeof data.kidId === 'string' ? data.kidId : '';
		const subscribed = typeof data.subscribed === 'boolean' ? data.subscribed : true;

		if (!firstName || !lastName || !email || !phoneNumber || !kidId) {
			return json(
				{ error: 'Missing required fields: firstName, lastName, email, phoneNumber, kidId' },
				{ status: 400 }
			);
		}

		const selectedKid = await getKidById(kidId);
		if (!selectedKid) {
			return json({ error: 'Selected kid not found' }, { status: 400 });
		}
		if (selectedKid.archived) {
			return json({ error: 'This child is no longer available for sponsorship' }, { status: 400 });
		}

		const sponsor = await createSponsor({
			firstName,
			lastName,
			email,
			phoneNumber,
			sponsorshipType: 'prayer',
			subscribed,
			kidIds: [kidId]
		});

		return json({ sponsor }, { status: 201 });
	} catch (error) {
		console.error('Error creating prayer sponsor:', error);
		return json({ error: 'Failed to submit prayer sponsor request' }, { status: 500 });
	}
};
