import type { PageServerLoad } from './$types';
import { getAllKids } from '$lib/server/sponsors';

export const load: PageServerLoad = async () => {
	const kids = await getAllKids();
	const unsponsoredKids = kids.filter(
		(kid) => kid.sponsors.length === 0 && !kid.archived
	);

	return {
		kids: unsponsoredKids.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
	};
};
