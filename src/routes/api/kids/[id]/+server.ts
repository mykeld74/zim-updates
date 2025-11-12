import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getKidById, updateKid, deleteKid } from '$lib/server/sponsors';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const kid = await getKidById(params.id);

		if (!kid) {
			return json({ error: 'Kid not found' }, { status: 404 });
		}

		return json({ kid });
	} catch (error) {
		console.error('Error fetching kid:', error);
		return json({ error: 'Failed to fetch kid' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();

		const kid = await updateKid(params.id, {
			name: data.name,
			birthday: data.birthday ? new Date(data.birthday) : data.birthday === null ? null : undefined,
			gender: data.gender,
			image: data.image,
			sponsorIds: data.sponsorIds
		});

		if (!kid) {
			return json({ error: 'Kid not found' }, { status: 404 });
		}

		return json({ kid });
	} catch (error) {
		console.error('Error updating kid:', error);
		return json({ error: 'Failed to update kid' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await deleteKid(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting kid:', error);
		return json({ error: 'Failed to delete kid' }, { status: 500 });
	}
};
