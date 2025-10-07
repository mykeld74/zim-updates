import { json } from '@sveltejs/kit';
import { cloudinary } from '$lib/server/cloudinary';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const folder = url.searchParams.get('folder') || 'zim-admin';

	try {
		const result = await cloudinary.api.resources({
			type: 'upload',
			prefix: folder,
			max_results: 100
		});

		return json({
			images: result.resources.map((resource: any) => ({
				publicId: resource.public_id,
				url: resource.secure_url,
				width: resource.width,
				height: resource.height,
				format: resource.format,
				createdAt: resource.created_at
			}))
		});
	} catch (error) {
		console.error('Error fetching Cloudinary images:', error);
		return json({ images: [] }, { status: 500 });
	}
};
