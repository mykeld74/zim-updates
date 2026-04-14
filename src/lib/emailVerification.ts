/** Path (with query) used after the user clicks the link in the verification email. */
export const emailVerificationCallbackPath = '/login?message=email-verified';

/** Full callback URL for better-auth (must match a trusted origin). Browser-only. */
export function getEmailVerificationCallbackUrl(): string {
	if (typeof window === 'undefined') {
		return '';
	}
	return `${window.location.origin}${emailVerificationCallbackPath}`;
}
