import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Post-login navigation: admin vs sponsor portal vs fallback login message. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ redirect: '/login' });
	}
	if (locals.user.role === 'admin') {
		return json({ redirect: '/admin' });
	}
	if (locals.hasSponsorAccount) {
		return json({ redirect: '/sponsor' });
	}
	return json({ redirect: '/login?message=pending' });
};
