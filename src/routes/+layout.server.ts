import { getPublishedPosts } from '$lib/server/updates';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Return a promise without awaiting - this streams the data without blocking page render
	return {
		posts: getPublishedPosts(20),
		user: locals.user
	};
};
