import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getKidById, updateKid, deleteKid } from '$lib/server/sponsors';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function requireApprovedUser(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const currentUser = await db.query.user.findFirst({
		where: eq(userTable.id, locals.user.id)
	});

	if (!currentUser?.approved) {
		throw error(403, 'Forbidden: Account not approved');
	}
}

export const GET: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		const kid = await getKidById(params.id);

		if (!kid) {
			return json({ error: 'Kid not found' }, { status: 404 });
		}

		return json({ kid });
	} catch (err) {
		console.error('Error fetching kid:', err);
		return json({ error: 'Failed to fetch kid' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	await requireApprovedUser(locals);

	try {
		const data = await request.json();

		const kid = await updateKid(params.id, {
			name: data.name,
			nickname:
				data.nickname === undefined
					? undefined
					: typeof data.nickname === 'string'
						? data.nickname.trim() || null
						: null,
			tagline: data.tagline,
			birthday: data.birthday ? new Date(data.birthday) : data.birthday === null ? null : undefined,
			gender: data.gender,
			image: data.image,
			description: data.description,
			featuredImage: data.featuredImage,
			images: Array.isArray(data.images) ? data.images : undefined,
			sponsorIds: data.sponsorIds,
			archived: typeof data.archived === 'boolean' ? data.archived : undefined,
			archiveReason:
				data.archiveReason === null
					? null
					: typeof data.archiveReason === 'string'
						? data.archiveReason
						: undefined
		});

		if (!kid) {
			return json({ error: 'Kid not found' }, { status: 404 });
		}

		return json({ kid });
	} catch (err) {
		console.error('Error updating kid:', err);
		return json({ error: 'Failed to update kid' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	await requireApprovedUser(locals);

	try {
		await deleteKid(params.id);
		return json({ success: true });
	} catch (err) {
		console.error('Error deleting kid:', err);
		return json({ error: 'Failed to delete kid' }, { status: 500 });
	}
};
