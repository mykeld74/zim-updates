import type { PageServerLoad } from './$types';
import { getAllKids } from '$lib/server/sponsors';

export const load: PageServerLoad = async ({ locals }) => {
	const kids = await getAllKids();
	const unsponsoredKids = kids.filter(
		(kid) => kid.sponsors.length === 0 && !kid.archived
	);
	const user = locals.user
		? {
				name: locals.user.name,
				email: locals.user.email
			}
		: null;

	return {
		kids: unsponsoredKids.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
		user
	};
};
