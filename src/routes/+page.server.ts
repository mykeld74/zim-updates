import { getPortraitFlagsForPosts } from '$lib/server/cloudinaryFaces';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { posts } = await parent();
	const resolvedPosts = await posts;
	const homePosts = resolvedPosts.slice(0, 4);
	const portraitByPostId = await getPortraitFlagsForPosts(homePosts);

	return { portraitByPostId };
};
