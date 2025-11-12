import { env } from '$env/dynamic/private';

export interface Block {
	id: string;
	blockType: string;
	blockName?: string;
	[key: string]: any; // Allow any additional block-specific fields
}

export interface UpdatePost {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	content?: any; // Keep for backward compatibility
	layout?: Block[]; // New blocks field
	featuredImage?: string;
	featured_image?: string; // Payload API format
	author: string;
	createdAt: string;
	updatedAt: string;
	created_at: string; // Payload API format
	updated_at: string; // Payload API format
	status?: 'draft' | 'published';
}

const PAYLOAD_API_URL = env.PAYLOAD_API_URL || 'http://localhost:3000/api';

export async function getPublishedPosts(limit = 10): Promise<UpdatePost[]> {
	try {
		// Try different sort field names
		let url = `${PAYLOAD_API_URL}/updates?sort=-createdAt&limit=${limit}`;
		let response = await fetch(url);

		// If createdAt fails, try created_at
		if (response.status === 500) {
			url = `${PAYLOAD_API_URL}/updates?sort=-created_at&limit=${limit}`;
			response = await fetch(url);
		}

		// If still failing, try without sort
		if (response.status === 500) {
			url = `${PAYLOAD_API_URL}/updates?limit=${limit}`;
			response = await fetch(url);
		}

		// If still failing, try with no parameters
		if (response.status === 500) {
			url = `${PAYLOAD_API_URL}/updates`;
			response = await fetch(url);
		}

		if (!response.ok) {
			console.error('Failed to fetch posts:', response.status, response.statusText);
			return [];
		}

		const result = await response.json();

		// Sort client-side if we have the data
		if (result.docs && result.docs.length > 0) {
			return (result.docs as UpdatePost[]).sort((a, b) => {
				const dateA = new Date(a.createdAt || a.created_at).getTime();
				const dateB = new Date(b.createdAt || b.created_at).getTime();
				return dateB - dateA; // newest first
			});
		}

		return result.docs as UpdatePost[];
	} catch (error) {
		console.error('Error fetching posts:', error);
		return [];
	}
}

export async function getPostBySlug(slug: string): Promise<UpdatePost | null> {
	try {
		// Try with depth first, fall back without depth if it fails
		let url = `${PAYLOAD_API_URL}/updates?where[slug][equals]=${slug}&limit=1&depth=2`;
		let response = await fetch(url);

		// If depth causes 500, try without depth
		if (response.status === 500) {
			url = `${PAYLOAD_API_URL}/updates?where[slug][equals]=${slug}&limit=1`;
			response = await fetch(url);
		}

		if (!response.ok) {
			console.error('Failed to fetch post:', response.status, response.statusText);
			return null;
		}

		const result = await response.json();
		return (result.docs[0] as UpdatePost) || null;
	} catch (error) {
		console.error('Error fetching post:', error);
		return null;
	}
}

export async function getAllPosts(): Promise<UpdatePost[]> {
	try {
		const response = await fetch(`${PAYLOAD_API_URL}/updates?sort=-created_at&limit=1000`);

		if (!response.ok) {
			console.error('Failed to fetch all posts:', response.statusText);
			return [];
		}

		const result = await response.json();
		return result.docs as UpdatePost[];
	} catch (error) {
		console.error('Error fetching all posts:', error);
		return [];
	}
}
