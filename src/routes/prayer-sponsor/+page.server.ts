import type { PageServerLoad } from './$types';
import { getAllKids } from '$lib/server/sponsors';
import { db } from '$lib/server/db';
import { sponsor } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/server/sponsorAccount';
import { asc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const kids = await getAllKids();
	const unsponsoredKids = kids.filter(
		(kid) => kid.sponsors.length === 0 && !kid.archived
	);
	const normalizedEmail = locals.user?.email ? normalizeEmail(locals.user.email) : '';
	const matchedSponsor = normalizedEmail
		? await db
				.select({ phoneNumber: sponsor.phoneNumber })
				.from(sponsor)
				.where(sql`lower(trim(${sponsor.email})) = ${normalizedEmail}`)
				.orderBy(asc(sponsor.createdAt))
				.limit(1)
		: [];
	const user = locals.user
		? {
				name: locals.user.name,
				email: locals.user.email
			}
		: null;

	return {
		kids: unsponsoredKids.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
		user,
		matchedSponsorPhoneNumber: matchedSponsor[0]?.phoneNumber ?? null
	};
};
