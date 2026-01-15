import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { kid } from '../src/lib/server/db/schema';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = neon(DATABASE_URL);
const db = drizzle(client);

const kidsToAdd = [
	'Brendon Nkoma',
	'Nicole',
	'Praise',
	'Nokuthala and Lisa',
	'Ebenezer',
	'Ncamsile',
	'Proffesor Moyo',
	'Seth',
	'Wellington',
	'Alisa Moyo',
	'Kuda',
	'Mitchell',
	'Mercy Munere',
	'Natalie'
];

async function seedKids() {
	console.log('Seeding kids...');

	const now = new Date();

	for (const name of kidsToAdd) {
		const id = crypto.randomUUID();

		try {
			await db.insert(kid).values({
				id,
				name,
				createdAt: now,
				updatedAt: now
			});
			console.log(`✓ Added: ${name}`);
		} catch (error) {
			console.error(`✗ Failed to add ${name}:`, error);
		}
	}

	console.log('Done seeding kids!');
	process.exit(0);
}

seedKids();
