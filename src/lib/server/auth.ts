import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const baseURL =
	env.BETTER_AUTH_URL || publicEnv.PUBLIC_BETTER_AUTH_URL || 'https://zim-updates.westwoodscc.org';

const trustedOrigins = [
	'http://localhost:5173',
	'http://localhost:5174',
	'https://zim-updates.westwoodscc.org',
	baseURL
].filter((url, index, self) => self.indexOf(url) === index);

export const auth = betterAuth({
	baseURL,
	trustedOrigins,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	emailAndPassword: {
		enabled: true
	}
});
