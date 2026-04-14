import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { svelteKitHandler, sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from './db';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getRequestEvent } from '$app/server';
import { sendEmail } from './email';
import { syncSponsorAccountForUser } from './sponsorAccount';

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
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			void sendEmail({
				to: [{ email: user.email, name: user.name }],
				subject: 'Verify your email — Zimbabwe Updates',
				html: `<p>Hi ${escapeHtml(user.name)},</p><p>Please verify your email to finish setting up your account. This link expires after a while—if it does, sign in once and we will send a new one.</p><p><a href="${escapeHtml(url)}">Verify email</a></p><p>If you did not sign up, you can ignore this message.</p>`,
				text: `Hi ${user.name},\n\nVerify your email (link expires after a period):\n${url}\n`
			}).then((result) => {
				if (!result.success) {
					console.error('sendVerificationEmail:', result.error);
				}
			});
		},
		sendOnSignUp: true,
		sendOnSignIn: true,
		/** Sets session cookie and redirects to callbackURL after a successful verify link. */
		autoSignInAfterVerification: true
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true
	},
	databaseHooks: {
		session: {
			create: {
				after: async (session) => {
					if (session.userId) {
						await syncSponsorAccountForUser(session.userId);
					}
				}
			}
		},
		user: {
			update: {
				after: async (user) => {
					if (user?.id) {
						await syncSponsorAccountForUser(user.id);
					}
				}
			}
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export { svelteKitHandler };
