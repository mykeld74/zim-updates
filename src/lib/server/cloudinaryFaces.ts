import { cloudinary } from './cloudinary';

const faceCountCache = new Map<string, number>();

function normalizePublicId(source: string): string | null {
	const trimmed = source.trim();
	if (!trimmed) return null;

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		const match = trimmed.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
		return match?.[1] ?? null;
	}

	return trimmed;
}

export async function getFaceCount(source: string): Promise<number | null> {
	const publicId = normalizePublicId(source);
	if (!publicId) return null;

	if (faceCountCache.has(publicId)) {
		return faceCountCache.get(publicId)!;
	}

	try {
		const result = await cloudinary.api.resource(publicId, { faces: true, type: 'upload' });
		const count = Array.isArray(result.faces) ? result.faces.length : 0;
		faceCountCache.set(publicId, count);
		return count;
	} catch {
		return null;
	}
}

export async function isSinglePortraitImage(source: string): Promise<boolean> {
	const count = await getFaceCount(source);
	return count === 1;
}

export async function getPortraitFlagsForPosts(
	posts: Array<{ id: string; featuredImage?: string | null; featured_image?: string | null }>
): Promise<Record<string, boolean>> {
	const flags: Record<string, boolean> = {};

	await Promise.all(
		posts.map(async (post) => {
			const source = post.featuredImage || post.featured_image;
			if (!source) {
				flags[post.id] = false;
				return;
			}

			flags[post.id] = await isSinglePortraitImage(source);
		})
	);

	return flags;
}
