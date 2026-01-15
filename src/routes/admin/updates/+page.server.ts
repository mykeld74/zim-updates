import type { PageServerLoad } from './$types';
import { getAllUpdates } from '$lib/server/updates';

export const load: PageServerLoad = async () => {
	const updates = await getAllUpdates();

	return {
		updates
	};
};
