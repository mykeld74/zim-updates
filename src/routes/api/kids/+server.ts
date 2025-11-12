import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllKids, createKid } from '$lib/server/sponsors';

export const GET: RequestHandler = async () => {
	try {
		const kids = await getAllKids();
		return json({ kids });
	} catch (error) {
		console.error('Error fetching kids:', error);
		return json({ error: 'Failed to fetch kids' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
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
