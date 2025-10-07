import { json } from '@sveltejs/kit';
import { createSignedUpload } from '$lib/server/cloudinary';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { folder, tags, public_id } = body;

	const signedData = await createSignedUpload({
		folder,
		tags,
		public_id
	});

	return json(signedData);
};
