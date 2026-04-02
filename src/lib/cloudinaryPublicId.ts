/** Normalizes a user-facing name to the Cloudinary public_id segment we use with `folder`. */
export function sanitizePublicId(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\.[^/.]+$/, '')
		.replace(/[^a-z0-9/_-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

export function getFullPublicId(baseName: string, folder?: string): string {
	const sanitized = sanitizePublicId(baseName);
	return folder ? `${folder}/${sanitized}` : sanitized;
}
