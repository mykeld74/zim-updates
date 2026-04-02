import { json, error, isHttpError } from '@sveltejs/kit';
import { cloudinary, createSignedUpload } from '$lib/server/cloudinary';
import { sanitizePublicId } from '$lib/cloudinaryPublicId';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

function cloudinaryErrorHttpCode(err: unknown): number | undefined {
	if (!err || typeof err !== 'object') return undefined;
	const e = err as Record<string, unknown>;
	const nested = e.error;
	if (nested && typeof nested === 'object' && 'http_code' in nested) {
		const code = (nested as { http_code?: number }).http_code;
		if (typeof code === 'number') return code;
	}
	if (typeof e.http_code === 'number') return e.http_code;
	return undefined;
}

async function requireApprovedUser(locals: App.Locals) {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (dev) {
		return;
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
	const { folder, tags, public_id: rawPublicId } = body;

	let public_id: string | undefined;
	if (typeof rawPublicId === 'string' && rawPublicId.trim()) {
		public_id = sanitizePublicId(rawPublicId);
		if (!public_id) {
			throw error(400, 'Invalid image name');
		}
	}

	if (public_id) {
		const fullPublicId = folder ? `${folder}/${public_id}` : public_id;
		try {
			await cloudinary.api.resource(fullPublicId);
			throw error(409, 'An image with this name already exists');
		} catch (err: unknown) {
			if (isHttpError(err) && err.status === 409) throw err;
			const httpCode = cloudinaryErrorHttpCode(err);
			if (httpCode !== 404) {
				console.error('Cloudinary resource check:', err);
				throw error(502, 'Could not verify image name');
			}
		}
	}

	const signedData = await createSignedUpload({
		folder,
		tags,
		public_id
	});

	return json(signedData);
};
