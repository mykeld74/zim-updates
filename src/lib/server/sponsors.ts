import { db } from './db';
import { sponsor, kid, sponsorKid } from './db/schema';
import { eq, and } from 'drizzle-orm';

export interface Sponsor {
	id: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	email: string;
	sponsorshipType: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Kid {
	id: string;
	name: string;
	birthday?: Date | null;
	gender?: string | null;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface SponsorWithKids extends Sponsor {
	kids: Kid[];
}

export interface KidWithSponsors extends Kid {
	sponsors: Sponsor[];
}

// Generate unique ID (simple implementation, consider using nanoid or uuid in production)
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Sponsor CRUD operations
export async function createSponsor(data: {
	firstName: string;
	lastName: string;
	phoneNumber: string;
	email: string;
	sponsorshipType?: string;
	kidIds?: string[];
}) {
	const now = new Date();
	const sponsorId = generateId();

	// Create sponsor
	await db.insert(sponsor).values({
		id: sponsorId,
		firstName: data.firstName,
		lastName: data.lastName,
		phoneNumber: data.phoneNumber,
		email: data.email,
		sponsorshipType: data.sponsorshipType || 'individual',
		createdAt: now,
		updatedAt: now
	});

	// Link kids if provided
	if (data.kidIds && data.kidIds.length > 0) {
		await db.insert(sponsorKid).values(
			data.kidIds.map((kidId) => ({
				sponsorId,
				kidId,
				createdAt: now
			}))
		);
	}

	return getSponsorById(sponsorId);
}

export async function getSponsorById(id: string): Promise<SponsorWithKids | null> {
	const sponsorData = await db.select().from(sponsor).where(eq(sponsor.id, id)).limit(1);

	if (sponsorData.length === 0) return null;

	// Get associated kids
	const kidData = await db
		.select({
			id: kid.id,
			name: kid.name,
			birthday: kid.birthday,
			gender: kid.gender,
			image: kid.image,
			createdAt: kid.createdAt,
			updatedAt: kid.updatedAt
		})
		.from(kid)
		.innerJoin(sponsorKid, eq(kid.id, sponsorKid.kidId))
		.where(eq(sponsorKid.sponsorId, id));

	return {
		...sponsorData[0],
		kids: kidData
	};
}

export async function getAllSponsors(): Promise<SponsorWithKids[]> {
	const sponsors = await db.select().from(sponsor);

	// Get all sponsor-kid relationships
	const relationships = await db
		.select({
			sponsorId: sponsorKid.sponsorId,
			kid: {
				id: kid.id,
				name: kid.name,
				birthday: kid.birthday,
				gender: kid.gender,
				image: kid.image,
				createdAt: kid.createdAt,
				updatedAt: kid.updatedAt
			}
		})
		.from(sponsorKid)
		.innerJoin(kid, eq(kid.id, sponsorKid.kidId));

	// Map sponsors with their kids
	return sponsors.map((s) => ({
		...s,
		kids: relationships.filter((r) => r.sponsorId === s.id).map((r) => r.kid)
	}));
}

export async function updateSponsor(
	id: string,
	data: {
		firstName?: string;
		lastName?: string;
		phoneNumber?: string;
		email?: string;
		sponsorshipType?: string;
		kidIds?: string[];
	}
) {
	const now = new Date();

	// Update sponsor basic info
	const updateData: any = { updatedAt: now };
	if (data.firstName !== undefined) updateData.firstName = data.firstName;
	if (data.lastName !== undefined) updateData.lastName = data.lastName;
	if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
	if (data.email !== undefined) updateData.email = data.email;
	if (data.sponsorshipType !== undefined) updateData.sponsorshipType = data.sponsorshipType;

	await db.update(sponsor).set(updateData).where(eq(sponsor.id, id));

	// Update kids relationship if provided
	if (data.kidIds !== undefined) {
		// Remove all existing relationships
		await db.delete(sponsorKid).where(eq(sponsorKid.sponsorId, id));

		// Add new relationships
		if (data.kidIds.length > 0) {
			await db.insert(sponsorKid).values(
				data.kidIds.map((kidId) => ({
					sponsorId: id,
					kidId,
					createdAt: now
				}))
			);
		}
	}

	return getSponsorById(id);
}

export async function deleteSponsor(id: string) {
	// Delete sponsor (cascade will handle sponsor-kid relationships)
	await db.delete(sponsor).where(eq(sponsor.id, id));
}

// Kid CRUD operations
export async function createKid(data: {
	name: string;
	birthday?: Date;
	gender?: string;
	image?: string;
	sponsorIds?: string[];
}) {
	const now = new Date();
	const kidId = generateId();

	// Create kid
	await db.insert(kid).values({
		id: kidId,
		name: data.name,
		birthday: data.birthday || null,
		gender: data.gender || null,
		image: data.image || null,
		createdAt: now,
		updatedAt: now
	});

	// Link sponsors if provided
	if (data.sponsorIds && data.sponsorIds.length > 0) {
		await db.insert(sponsorKid).values(
			data.sponsorIds.map((sponsorId) => ({
				sponsorId,
				kidId,
				createdAt: now
			}))
		);
	}

	return getKidById(kidId);
}

export async function getKidById(id: string): Promise<KidWithSponsors | null> {
	const kidData = await db.select().from(kid).where(eq(kid.id, id)).limit(1);

	if (kidData.length === 0) return null;

	// Get associated sponsors
	const sponsorData = await db
		.select({
			id: sponsor.id,
			firstName: sponsor.firstName,
			lastName: sponsor.lastName,
			phoneNumber: sponsor.phoneNumber,
			email: sponsor.email,
			createdAt: sponsor.createdAt,
			updatedAt: sponsor.updatedAt
		})
		.from(sponsor)
		.innerJoin(sponsorKid, eq(sponsor.id, sponsorKid.sponsorId))
		.where(eq(sponsorKid.kidId, id));

	return {
		...kidData[0],
		sponsors: sponsorData
	};
}

export async function getAllKids(): Promise<KidWithSponsors[]> {
	const kids = await db.select().from(kid);

	// Get all sponsor-kid relationships
	const relationships = await db
		.select({
			kidId: sponsorKid.kidId,
			sponsor: {
				id: sponsor.id,
				firstName: sponsor.firstName,
				lastName: sponsor.lastName,
				phoneNumber: sponsor.phoneNumber,
				email: sponsor.email,
				createdAt: sponsor.createdAt,
				updatedAt: sponsor.updatedAt
			}
		})
		.from(sponsorKid)
		.innerJoin(sponsor, eq(sponsor.id, sponsorKid.sponsorId));

	// Map kids with their sponsors
	return kids.map((k) => ({
		...k,
		sponsors: relationships.filter((r) => r.kidId === k.id).map((r) => r.sponsor)
	}));
}

export async function updateKid(
	id: string,
	data: {
		name?: string;
		birthday?: Date | null;
		gender?: string | null;
		image?: string | null;
		sponsorIds?: string[];
	}
) {
	const now = new Date();

	// Update kid basic info
	const updateData: any = { updatedAt: now };
	if (data.name !== undefined) updateData.name = data.name;
	if (data.birthday !== undefined) updateData.birthday = data.birthday;
	if (data.gender !== undefined) updateData.gender = data.gender;
	if (data.image !== undefined) updateData.image = data.image;

	await db.update(kid).set(updateData).where(eq(kid.id, id));

	// Update sponsors relationship if provided
	if (data.sponsorIds !== undefined) {
		// Remove all existing relationships
		await db.delete(sponsorKid).where(eq(sponsorKid.kidId, id));

		// Add new relationships
		if (data.sponsorIds.length > 0) {
			await db.insert(sponsorKid).values(
				data.sponsorIds.map((sponsorId) => ({
					sponsorId,
					kidId: id,
					createdAt: now
				}))
			);
		}
	}

	return getKidById(id);
}

export async function deleteKid(id: string) {
	// Delete kid (cascade will handle sponsor-kid relationships)
	await db.delete(kid).where(eq(kid.id, id));
}

// Relationship management
export async function addKidToSponsor(sponsorId: string, kidId: string) {
	const now = new Date();

	// Check if relationship already exists
	const existing = await db
		.select()
		.from(sponsorKid)
		.where(and(eq(sponsorKid.sponsorId, sponsorId), eq(sponsorKid.kidId, kidId)))
		.limit(1);

	if (existing.length === 0) {
		await db.insert(sponsorKid).values({
			sponsorId,
			kidId,
			createdAt: now
		});
	}
}

export async function removeKidFromSponsor(sponsorId: string, kidId: string) {
	await db
		.delete(sponsorKid)
		.where(and(eq(sponsorKid.sponsorId, sponsorId), eq(sponsorKid.kidId, kidId)));
}
