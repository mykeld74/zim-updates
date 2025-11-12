import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sponsor } from '../src/lib/server/db/schema';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = neon(DATABASE_URL);
const db = drizzle(client);

const sponsorsData = [
	{
		id: '1',
		firstName: 'Mike',
		lastName: 'Daugherty',
		email: 'mike@msdweb.pro',
		phoneNumber: '303-908-5059'
	},
	{
		id: '2',
		firstName: 'Jacqui',
		lastName: 'Daugherty',
		email: 'jacquid1974@gmail.com',
		phoneNumber: '303-717-8328'
	},
	{
		id: '3',
		firstName: 'Jasmine and Erik',
		lastName: 'Meister',
		email: 'Jas7720@gmail.com',
		phoneNumber: '303-808-0967'
	},
	{
		id: '4',
		firstName: 'Cari',
		lastName: 'Schieffelin',
		email: 'Jcsmmw@gmail.com',
		phoneNumber: '303-807-0092'
	},
	{
		id: '5',
		firstName: 'Bethany',
		lastName: 'Brooks',
		email: 'bethanybrooks06@gmail.com',
		phoneNumber: '303-330-1145'
	},
	{
		id: '6',
		firstName: 'Charlie',
		lastName: 'Eberly',
		email: 'Ceberly3@gmail.com',
		phoneNumber: '717-870-3991'
	},
	{
		id: '7',
		firstName: 'Brooks',
		lastName: 'Fam',
		email: 'sarahbrooks7@gmail.com',
		phoneNumber: '970-260-5331'
	},
	{
		id: '8',
		firstName: 'Kendall',
		lastName: 'Kostelic',
		email: 'kendall.kostelic@gmail.com',
		phoneNumber: '719-651-6766'
	},
	{
		id: '9',
		firstName: 'Sara',
		lastName: 'Phelps',
		email: 'saramhonda@gmail.com',
		phoneNumber: '303-653-3148'
	},
	{
		id: '10',
		firstName: 'Taryn',
		lastName: 'Marchena',
		email: 'tarynrfuchs@gmail.com',
		phoneNumber: '303-999-9417'
	},
	{
		id: '11',
		firstName: 'Sanchez',
		lastName: 'family',
		email: 'Chrisanchez86@gmail.com',
		phoneNumber: '760-828-6422'
	},
	{
		id: '12',
		firstName: 'Lucas',
		lastName: 'Hayes',
		email: 'lnhayes216@gmail.com',
		phoneNumber: '720-725-5946'
	},
	{
		id: '13',
		firstName: 'The',
		lastName: 'Rineharts',
		email: 'Beckylee712@mac.com',
		phoneNumber: '720-308-2040'
	},
	{
		id: '14',
		firstName: 'Andrea',
		lastName: 'Hitchcock',
		email: 'Ashitch22@gmail.com',
		phoneNumber: '720-301-5483'
	},
	{
		id: '15',
		firstName: 'Bethany Eve',
		lastName: 'Kelly',
		email: 'worshipfulbethany@gmail.com',
		phoneNumber: '616-617-6363'
	},
	{
		id: '16',
		firstName: 'Ver Miller',
		lastName: 'Missional Community',
		email: 'Jannadiane@hotmail.com',
		phoneNumber: '303-519-0430'
	},
	{
		id: '17',
		firstName: 'Kaden',
		lastName: 'Daugherty',
		email: 'kdaug03@gmail.com',
		phoneNumber: '720 338 6192'
	},
	{
		id: '18',
		firstName: 'Malachi',
		lastName: 'Daugherty',
		email: 'malachidaugherty@gmail.com',
		phoneNumber: '720-768-6301'
	},
	{
		id: '19',
		firstName: 'Jennifer',
		lastName: 'Indelicato',
		email: 'jdi2729@aol.com',
		phoneNumber: '720-989-9700'
	},
	{
		id: '20',
		firstName: 'Sue',
		lastName: 'Barnett',
		email: 'sbgrandma6@gmail.com',
		phoneNumber: '303-250-4738'
	},
	{
		id: '21',
		firstName: 'Rick and Shanna',
		lastName: 'Schmitz',
		email: 'rick@westwoodscc.org',
		phoneNumber: '303-550-7199'
	},
	{
		id: '23',
		firstName: 'Kevin',
		lastName: 'Halstead',
		email: 'mrmichael423@icloud.com',
		phoneNumber: '720-988-0629'
	},
	{
		id: '24',
		firstName: 'Scott and Amy',
		lastName: 'Jenkins',
		email: 'jinxcrew@juno.com',
		phoneNumber: '303-456-2899'
	},
	{
		id: '25',
		firstName: 'Peggy',
		lastName: 'Parrott',
		email: 'pparrottquilt@gmail.com',
		phoneNumber: '303-986-8229'
	},
	{
		id: '26',
		firstName: 'Nate and Stacy',
		lastName: 'Baumgart',
		email: 'engineerchick@gmail.com',
		phoneNumber: '303-748-5467'
	},
	{
		id: '27',
		firstName: 'Jill',
		lastName: 'Hurley',
		email: 'sisu539@gmail.com',
		phoneNumber: ''
	},
	{
		id: '28',
		firstName: 'Karisa',
		lastName: 'Eberly',
		email: 'karisaeberly@gmail.com',
		phoneNumber: '717-695-1845'
	},
	{
		id: '29',
		firstName: 'Gennette',
		lastName: 'Brink',
		email: 'gennbrink@aol.com',
		phoneNumber: '720-338-6478'
	}
];

async function seedSponsors() {
	console.log('Seeding sponsors...');

	const now = new Date();

	for (const sponsorData of sponsorsData) {
		try {
			await db.insert(sponsor).values({
				id: sponsorData.id,
				firstName: sponsorData.firstName,
				lastName: sponsorData.lastName,
				email: sponsorData.email,
				phoneNumber: sponsorData.phoneNumber,
				createdAt: now,
				updatedAt: now
			});
			console.log(`✓ Added ${sponsorData.firstName} ${sponsorData.lastName}`);
		} catch (error) {
			console.error(`✗ Failed to add ${sponsorData.firstName} ${sponsorData.lastName}:`, error);
		}
	}

	console.log('Seeding complete!');
	process.exit(0);
}

seedSponsors();
