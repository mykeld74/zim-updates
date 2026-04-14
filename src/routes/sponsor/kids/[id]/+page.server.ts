import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSponsorWithKidsForUser } from '$lib/server/sponsorAccount';
import { sanitizeRichHtml } from '$lib/server/sanitizeRichHtml';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const sponsor = await getSponsorWithKidsForUser(locals.user.id);
	const kid = sponsor?.kids.find((k) => k.id === params.id);
	if (!kid) {
		throw error(404, 'Not found');
	}

	const descriptionHtml =
		kid.description && kid.description.trim().length > 0 ? sanitizeRichHtml(kid.description) : '';

	return { kid, descriptionHtml };
};
