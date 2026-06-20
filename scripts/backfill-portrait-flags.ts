/**
 * One-time backfill for `update.featuredIsPortrait`.
 *
 * Run AFTER the column exists in the DB (i.e. after `npm run db:push`):
 *   npm run backfill:portraitFlags
 *
 * For every update that has a featured image, ask Cloudinary how many faces the
 * image contains and cache `featuredIsPortrait = (faces === 1)`. This is the same
 * logic the app now runs on write, so existing rows match new ones.
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { update } from '../src/lib/server/db/schema';

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
	if (!process.env[key]) throw new Error(`${key} is not set`);
}

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

const db = drizzle(neon(DATABASE_URL));

/** Mirror of normalizePublicId in src/lib/server/cloudinaryFaces.ts. */
function normalizePublicId(source: string): string | null {
	const trimmed = source.trim();
	if (!trimmed) return null;

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		const match = trimmed.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
		return match?.[1] ?? null;
	}

	return trimmed;
}

async function getFaceCount(publicId: string): Promise<number | null> {
	try {
		const result = await cloudinary.api.resource(publicId, { faces: true, type: 'upload' });
		return Array.isArray(result.faces) ? result.faces.length : 0;
	} catch {
		return null;
	}
}

async function main() {
	const rows = await db
		.select({ id: update.id, slug: update.slug, featuredImage: update.featuredImage })
		.from(update);

	let updated = 0;
	for (const row of rows) {
		const publicId = row.featuredImage ? normalizePublicId(row.featuredImage) : null;
		const count = publicId ? await getFaceCount(publicId) : null;
		const isPortrait = count === 1;

		await db.update(update).set({ featuredIsPortrait: isPortrait }).where(eq(update.id, row.id));
		updated++;
		console.log(`${row.slug}: faces=${count ?? 'n/a'} portrait=${isPortrait}`);
	}

	console.log(`\nBackfilled ${updated} update(s).`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
