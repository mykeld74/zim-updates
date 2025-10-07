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
				emailVerified: boolean;
				name: string;
				image?: string | null;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
