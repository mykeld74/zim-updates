import type { PageServerLoad } from './$types';
import { getAllSponsors, getAllKids } from '$lib/server/sponsors';

export const load: PageServerLoad = async () => {
	const [sponsors, kids] = await Promise.all([getAllSponsors(), getAllKids()]);

	return {
		sponsors,
		kids
	};
};
