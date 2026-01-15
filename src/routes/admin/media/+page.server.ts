import type { PageServerLoad } from './$types';
import { cloudinary } from '$lib/server/cloudinary';

interface CloudinaryResource {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	created_at: string;
}

export const load: PageServerLoad = async () => {
	try {
		const result = await cloudinary.api.resources({
			type: 'upload',
			prefix: 'zim-admin',
			max_results: 100
		});

		const images = result.resources.map((resource: CloudinaryResource) => ({
			publicId: resource.public_id,
			url: resource.secure_url,
			width: resource.width,
			height: resource.height,
			format: resource.format,
			createdAt: resource.created_at
		}));

		return {
			images
		};
	} catch (error) {
		console.error('Error loading images:', error);
		return {
			images: []
		};
	}
};
