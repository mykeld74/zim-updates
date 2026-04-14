import { db } from './db';
import { sponsor, sponsorKid, user as userTable } from './db/schema';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { generateId } from '$lib/utils';
import { getSponsorById, type SponsorWithKids } from './sponsors';

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function getSponsorWithKidsForUser(userId: string): Promise<SponsorWithKids | null> {
	const linkedSponsors = await db
		.select({ id: sponsor.id })
		.from(sponsor)
		.where(eq(sponsor.userId, userId))
		.orderBy(asc(sponsor.createdAt));
	if (linkedSponsors.length === 0) return null;

	const sponsorRecords = await Promise.all(linkedSponsors.map((row) => getSponsorById(row.id)));
	const primary = sponsorRecords.find((row) => row !== null) ?? null;
	if (!primary) return null;

	if (sponsorRecords.length === 1) return primary;

	const kidMap = new Map(primary.kids.map((kid) => [kid.id, kid]));
	for (const record of sponsorRecords) {
		if (!record) continue;
		for (const linkedKid of record.kids) {
			if (!kidMap.has(linkedKid.id)) {
				kidMap.set(linkedKid.id, linkedKid);
			}
		}
	}

	return {
		...primary,
		kids: [...kidMap.values()]
	};
}

export async function userHasLinkedSponsor(userId: string): Promise<boolean> {
	const row = await db.select({ id: sponsor.id }).from(sponsor).where(eq(sponsor.userId, userId)).limit(1);
	return row.length > 0;
}

/**
 * Link and merge unclaimed sponsor rows matching this email (oldest `createdAt` first).
 * If a sponsor is already linked to this user, new matching unclaimed rows are merged into it.
 */
export async function linkSponsorToUserIfEligible(userId: string, email: string): Promise<void> {
	const normalized = normalizeEmail(email);
	const linkedSponsor = await db
		.select({ id: sponsor.id })
		.from(sponsor)
		.where(eq(sponsor.userId, userId))
		.orderBy(asc(sponsor.createdAt))
		.limit(1);
	const matches = await db
		.select()
		.from(sponsor)
		.where(sql`lower(trim(${sponsor.email})) = ${normalized}`)
		.orderBy(asc(sponsor.createdAt))
		.limit(100);

	if (linkedSponsor.length === 0 && matches.length === 0) return;

	const primarySponsorId = linkedSponsor[0]?.id ?? matches[0].id;
	if (!primarySponsorId) return;

	await db
		.update(sponsor)
		.set({ userId, updatedAt: new Date() })
		.where(eq(sponsor.id, primarySponsorId));

	const mergeSourceIds = matches
		.map((row) => row.id)
		.filter((sponsorId) => sponsorId !== primarySponsorId);
	if (mergeSourceIds.length === 0) return;

	// Move kid links from duplicate sponsor rows to the user's primary sponsor row.
	const duplicateKidLinks = await db
		.select({ kidId: sponsorKid.kidId })
		.from(sponsorKid)
		.where(inArray(sponsorKid.sponsorId, mergeSourceIds));

	if (duplicateKidLinks.length > 0) {
		await db
			.insert(sponsorKid)
			.values(
				duplicateKidLinks.map(({ kidId }) => ({
					sponsorId: primarySponsorId,
					kidId,
					createdAt: new Date()
				}))
			)
			.onConflictDoNothing({ target: [sponsorKid.sponsorId, sponsorKid.kidId] });
	}

	// Remove merged duplicate sponsor rows once their relationships are migrated.
	await db.delete(sponsor).where(inArray(sponsor.id, mergeSourceIds));
}

function splitDisplayName(name: string): { firstName: string; lastName: string } {
	const trimmed = name.trim();
	if (!trimmed) return { firstName: 'Sponsor', lastName: '' };
	const parts = trimmed.split(/\s+/);
	if (parts.length === 1) return { firstName: parts[0], lastName: '' };
	return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Create a sponsor row for a portal user (no kids until staff assigns). */
export async function createSponsorForPortalUser(user: {
	id: string;
	email: string;
	name: string;
}): Promise<void> {
	const { firstName, lastName } = splitDisplayName(user.name);
	const now = new Date();
	const sponsorId = generateId();

	await db.insert(sponsor).values({
		id: sponsorId,
		userId: user.id,
		firstName,
		lastName,
		phoneNumber: null,
		email: user.email.trim(),
		sponsorshipType: 'individual',
		subscribed: true,
		createdAt: now,
		updatedAt: now
	});
}

/**
 * After email is verified: link by email, then create sponsor row only for portal signups
 * when still unlinked.
 */
export async function syncSponsorAccountForUser(userId: string): Promise<void> {
	const row = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1).then((r) => r[0]);
	if (!row?.emailVerified) return;

	await linkSponsorToUserIfEligible(userId, row.email);

	const linked = await userHasLinkedSponsor(userId);
	if (!linked && row.sponsorPortalSignup) {
		await createSponsorForPortalUser({
			id: row.id,
			email: row.email,
			name: row.name
		});
	}
}
