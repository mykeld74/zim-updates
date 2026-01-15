import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUpdateById } from '$lib/server/updates';

export const load: PageServerLoad = async ({ params }) => {
	const update = await getUpdateById(params.id);

	if (!update) {
		throw error(404, 'Update not found');
	}

	return {
		update
	};
};
