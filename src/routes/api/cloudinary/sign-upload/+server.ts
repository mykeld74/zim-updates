import { json, error } from '@sveltejs/kit';
import { createSignedUpload } from '$lib/server/cloudinary';
import type { RequestHandler } from './$types';
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

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireApprovedUser(locals);

	const body = await request.json();
	const { folder, tags, public_id } = body;

	const signedData = await createSignedUpload({
		folder,
		tags,
		public_id
	});

	return json(signedData);
};
