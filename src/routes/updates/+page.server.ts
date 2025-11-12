import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Use the preloaded data from the layout
	const { posts } = await parent();

	return {
		posts
	};
};
