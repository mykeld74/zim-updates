import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	addKidToSponsor,
	createSponsor,
	getKidById,
	getSponsorById,
	updateSponsor
} from '$lib/server/sponsors';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sponsor, user as userTable } from '$lib/server/db/schema';
import { linkSponsorToUserIfEligible, normalizeEmail } from '$lib/server/sponsorAccount';
import { and, asc, eq, sql } from 'drizzle-orm';
import { APIError } from 'better-auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
		const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
		const email = typeof data.email === 'string' ? data.email.trim() : '';
		const phoneNumber = typeof data.phoneNumber === 'string' ? data.phoneNumber.trim() : '';
		const sponsorshipType =
			typeof data.sponsorshipType === 'string' ? data.sponsorshipType.trim().toLowerCase() : '';
		const kidId = typeof data.kidId === 'string' ? data.kidId : '';
		const subscribed = typeof data.subscribed === 'boolean' ? data.subscribed : true;
		const password = typeof data.password === 'string' ? data.password : '';
		const confirmPassword = typeof data.confirmPassword === 'string' ? data.confirmPassword : '';
		const validSponsorshipTypes = new Set(['individual', 'family', 'group']);
		const normalizedFirstName = firstName || (sponsorshipType === 'group' ? 'Group' : 'Family');
		const normalizedEmail = normalizeEmail(email);
		let userId = locals.user?.id ?? null;
		let accountCreated = false;

		if (!lastName || !email || !phoneNumber || !kidId) {
			return json(
				{ error: 'Missing required fields: lastName, email, phoneNumber, kidId' },
				{ status: 400 }
			);
		}
		if (!sponsorshipType || !validSponsorshipTypes.has(sponsorshipType)) {
			return json({ error: 'Please select a valid sponsorship type' }, { status: 400 });
		}
		if (sponsorshipType === 'individual' && !firstName) {
			return json({ error: 'Missing required field: firstName' }, { status: 400 });
		}
		if (!locals.user) {
			if (!password || !confirmPassword) {
				return json(
					{
						error: 'Please add and confirm a password so we can create your account.'
					},
					{ status: 400 }
				);
			}
			if (password.length < 8) {
				return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
			}
			if (password !== confirmPassword) {
				return json({ error: 'Passwords do not match' }, { status: 400 });
			}
		}

		const selectedKid = await getKidById(kidId);
		if (!selectedKid) {
			return json({ error: 'Selected kid not found' }, { status: 400 });
		}
		if (selectedKid.archived) {
			return json({ error: 'This child is no longer available for sponsorship' }, { status: 400 });
		}

		if (!userId) {
			const existingUser = await db
				.select({ id: userTable.id })
				.from(userTable)
				.where(sql`lower(trim(${userTable.email})) = ${normalizedEmail}`)
				.limit(1);
			if (existingUser.length > 0) {
				return json(
					{
						error:
							'An account already exists for this email. Please sign in and then complete sponsorship.'
					},
					{ status: 409 }
				);
			}

			const callbackURL = new URL('/login?message=email-verified', request.url).href;
			const nameForAccount = `${normalizedFirstName} ${lastName}`.trim();
			try {
				await auth.api.signUpEmail({
					body: {
						name: nameForAccount || 'Sponsor',
						email,
						password,
						callbackURL
					},
					headers: request.headers
				});
			} catch (error) {
				if (error instanceof APIError) {
					return json(
						{ error: error.message || 'Could not create account' },
						{ status: typeof error.status === 'number' ? error.status : 400 }
					);
				}
				throw error;
			}

			const createdUser = await db
				.select({ id: userTable.id })
				.from(userTable)
				.where(sql`lower(trim(${userTable.email})) = ${normalizedEmail}`)
				.limit(1);
			if (createdUser.length === 0) {
				return json(
					{ error: 'Account created but user record was not found. Please sign in and try again.' },
					{ status: 500 }
				);
			}

			userId = createdUser[0].id;
			accountCreated = true;
			await db
				.update(userTable)
				.set({ sponsorPortalSignup: true, updatedAt: new Date() })
				.where(eq(userTable.id, userId));
		}

		await linkSponsorToUserIfEligible(userId, email);
		const linkedSponsorRows = await db
			.select({ id: sponsor.id })
			.from(sponsor)
			.where(and(eq(sponsor.userId, userId), sql`lower(trim(${sponsor.email})) = ${normalizedEmail}`))
			.orderBy(asc(sponsor.createdAt))
			.limit(1);

		let sponsorRecord;
		if (linkedSponsorRows.length > 0) {
			const linkedSponsorId = linkedSponsorRows[0].id;
			await updateSponsor(linkedSponsorId, {
				firstName: normalizedFirstName,
				lastName,
				email,
				phoneNumber,
				sponsorshipType,
				subscribed
			});
			await addKidToSponsor(linkedSponsorId, kidId);
			sponsorRecord = await getSponsorById(linkedSponsorId);
		} else {
			sponsorRecord = await createSponsor({
				userId,
				firstName: normalizedFirstName,
				lastName,
				email,
				phoneNumber,
				sponsorshipType,
				subscribed,
				kidIds: [kidId]
			});
		}

		return json(
			{
				sponsor: sponsorRecord,
				message: accountCreated
					? 'Sponsorship submitted and account created. Check your email to verify your account.'
					: 'Sponsorship submitted successfully.'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating prayer sponsor:', error);
		return json({ error: 'Failed to submit prayer sponsor request' }, { status: 500 });
	}
};
