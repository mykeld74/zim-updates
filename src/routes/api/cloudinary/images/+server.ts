import { json, error } from '@sveltejs/kit';
import { cloudinary } from '$lib/server/cloudinary';
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

interface CloudinaryResource {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	created_at: string;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	await requireApprovedUser(locals);

	const folder = url.searchParams.get('folder') || 'zim-admin';

	try {
		const result = await cloudinary.api.resources({
			type: 'upload',
			prefix: folder,
			max_results: 100
		});

		return json({
			images: result.resources.map((resource: CloudinaryResource) => ({
				publicId: resource.public_id,
				url: resource.secure_url,
				width: resource.width,
				height: resource.height,
				format: resource.format,
				createdAt: resource.created_at
			}))
		});
	} catch (err) {
		console.error('Error fetching Cloudinary images:', err);
		return json({ images: [] }, { status: 500 });
	}
};
