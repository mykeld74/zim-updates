/**
 * One-off: normalize all kid.description HTML (remove inline styles, etc.).
 *
 * Usage:
 *   pnpm strip:kidDescriptions           # apply updates
 *   pnpm strip:kidDescriptions --dry-run # print what would change only
 *
 * Requires DATABASE_URL (e.g. from .env).
 */
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, isNotNull } from 'drizzle-orm';
import { kid } from '../src/lib/server/db/schema';
import { sanitizeRichHtml } from '../src/lib/server/sanitizeRichHtml';

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const dryRun = process.argv.includes('--dry-run');

const db = drizzle(neon(DATABASE_URL));

const rows = await db
	.select({ id: kid.id, name: kid.name, description: kid.description })
	.from(kid)
	.where(isNotNull(kid.description));

let updated = 0;
let unchanged = 0;

for (const row of rows) {
	const original = row.description!;
	const cleaned = sanitizeRichHtml(original);

	if (cleaned === original) {
		unchanged++;
		continue;
	}

	updated++;
	console.log(`[${dryRun ? 'dry-run' : 'update'}] ${row.id} (${row.name})`);

	if (!dryRun) {
		await db
			.update(kid)
			.set({ description: cleaned, updatedAt: new Date() })
			.where(eq(kid.id, row.id));
	}
}

console.log(
	`Done. ${updated} kid(s) ${dryRun ? 'would be' : ''} updated, ${unchanged} unchanged (with description).`
);
