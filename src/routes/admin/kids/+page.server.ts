import type { PageServerLoad } from './$types';
import { getAllKids, getAllSponsors } from '$lib/server/sponsors';

export const load: PageServerLoad = async () => {
	const [kids, sponsors] = await Promise.all([getAllKids(), getAllSponsors()]);

	return {
		kids,
		sponsors
	};
};
