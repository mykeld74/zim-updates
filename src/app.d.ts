declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				id: string;
				createdAt: Date;
				updatedAt: Date;
				userId: string;
				expiresAt: Date;
				token: string;
				ipAddress?: string | null;
				userAgent?: string | null;
			} | null;
			user: {
				id: string;
				createdAt: Date;
				updatedAt: Date;
				email: string;
				role: 'admin' | 'sponsor';
				emailVerified: boolean;
				approved: boolean;
				sponsorPortalSignup: boolean;
				name: string;
				image?: string | null;
			} | null;
			/** True when a sponsor row links to this session's user (see hooks). */
			hasSponsorAccount: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
