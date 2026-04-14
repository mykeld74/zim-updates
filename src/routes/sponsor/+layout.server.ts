import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { syncSponsorAccountForUser, userHasLinkedSponsor } from '$lib/server/sponsorAccount';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const isSignupPage = url.pathname === '/sponsor/signup';

	if (isSignupPage) {
		if (locals.session?.userId && locals.user) {
			await syncSponsorAccountForUser(locals.user.id);
			const linked = await userHasLinkedSponsor(locals.user.id);
			if (linked) {
				throw redirect(303, '/sponsor');
			}
		}
		return { segment: 'signup' as const };
	}

	if (!locals.session?.userId || !locals.user) {
		const next = encodeURIComponent(url.pathname);
		throw redirect(303, `/login?next=${next}`);
	}

	await syncSponsorAccountForUser(locals.user.id);
	const linked = await userHasLinkedSponsor(locals.user.id);
	if (!linked) {
		throw redirect(303, '/sponsor/signup');
	}

	return { segment: 'portal' as const };
};
