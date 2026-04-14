import type { PageServerLoad } from './$types';
import { getSponsorWithKidsForUser } from '$lib/server/sponsorAccount';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { sponsor: null };
	}
	const sponsor = await getSponsorWithKidsForUser(locals.user.id);
	return { sponsor };
};
