import type { PageServerLoad } from './$types';
import { getAllSponsors } from '$lib/server/sponsors';
import { getPublishedUpdates } from '$lib/server/updates';

export const load: PageServerLoad = async () => {
	const [sponsors, updates] = await Promise.all([
		getAllSponsors(),
		getPublishedUpdates(20) // Get recent published updates
	]);

	return {
		sponsors,
		updates
	};
};
