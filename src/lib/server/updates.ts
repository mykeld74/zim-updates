import { db } from './db';
import { update } from './db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateId } from '$lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Block {
	id: string;
	blockType: string;
	blockName?: string;
	[key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LexicalContent {
	root?: {
		children?: any[];
	};
}

export interface UpdatePost {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	content?: LexicalContent | null;
	layout?: Block[] | null;
	featuredImage?: string | null;
	featured_image?: string | null; // Alias for compatibility
	author: string;
	status: 'draft' | 'published';
	createdAt: string;
	updatedAt: string;
	created_at?: string; // Alias for compatibility
	updated_at?: string; // Alias for compatibility
	publishedAt?: string | null;
}

export interface CreateUpdateData {
	title: string;
	slug: string;
	excerpt?: string;
	content?: LexicalContent;
	layout?: Block[];
	featuredImage?: string;
	author?: string;
	status?: 'draft' | 'published';
}

export interface UpdateUpdateData {
	title?: string;
	slug?: string;
	excerpt?: string | null;
	content?: LexicalContent | null;
	layout?: Block[] | null;
	featuredImage?: string | null;
	author?: string;
	status?: 'draft' | 'published';
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.substring(0, 100);
}

function mapToUpdatePost(row: typeof update.$inferSelect): UpdatePost {
	const createdAt = row.createdAt.toISOString();
	const updatedAt = row.updatedAt.toISOString();

	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		excerpt: row.excerpt,
		content: row.content as LexicalContent | null,
		layout: row.layout as Block[] | null,
		featuredImage: row.featuredImage,
		featured_image: row.featuredImage, // Alias
		author: row.author,
		status: row.status as 'draft' | 'published',
		createdAt,
		updatedAt,
		created_at: createdAt, // Alias
		updated_at: updatedAt, // Alias
		publishedAt: row.publishedAt?.toISOString() ?? null
	};
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function createUpdate(data: CreateUpdateData): Promise<UpdatePost> {
	const now = new Date();
	const id = generateId();
	const slug = data.slug || generateSlug(data.title);

	const [inserted] = await db
		.insert(update)
		.values({
			id,
			title: data.title,
			slug,
			excerpt: data.excerpt ?? null,
			content: data.content ?? null,
			layout: data.layout ?? null,
			featuredImage: data.featuredImage ?? null,
			author: data.author ?? 'Admin',
			status: data.status ?? 'draft',
			createdAt: now,
			updatedAt: now,
			publishedAt: data.status === 'published' ? now : null
		})
		.returning();

	return mapToUpdatePost(inserted);
}

export async function getUpdateById(id: string): Promise<UpdatePost | null> {
	const [row] = await db.select().from(update).where(eq(update.id, id)).limit(1);

	if (!row) return null;
	return mapToUpdatePost(row);
}

export async function getUpdateBySlug(slug: string): Promise<UpdatePost | null> {
	const [row] = await db.select().from(update).where(eq(update.slug, slug)).limit(1);

	if (!row) return null;
	return mapToUpdatePost(row);
}

export async function getAllUpdates(): Promise<UpdatePost[]> {
	const rows = await db.select().from(update).orderBy(desc(update.createdAt));

	return rows.map(mapToUpdatePost);
}

export async function getPublishedUpdates(limit = 10): Promise<UpdatePost[]> {
	const rows = await db
		.select()
		.from(update)
		.where(eq(update.status, 'published'))
		.orderBy(desc(update.publishedAt), desc(update.createdAt))
		.limit(limit);

	return rows.map(mapToUpdatePost);
}

export async function updateUpdate(id: string, data: UpdateUpdateData): Promise<UpdatePost | null> {
	const now = new Date();

	// Build update object
	const updateData: Partial<typeof update.$inferInsert> = {
		updatedAt: now
	};

	if (data.title !== undefined) updateData.title = data.title;
	if (data.slug !== undefined) updateData.slug = data.slug;
	if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
	if (data.content !== undefined) updateData.content = data.content;
	if (data.layout !== undefined) updateData.layout = data.layout;
	if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
	if (data.author !== undefined) updateData.author = data.author;

	// Handle status changes
	if (data.status !== undefined) {
		updateData.status = data.status;
		// Set publishedAt when first published
		if (data.status === 'published') {
			const existing = await getUpdateById(id);
			if (existing && !existing.publishedAt) {
				updateData.publishedAt = now;
			}
		}
	}

	const [updated] = await db.update(update).set(updateData).where(eq(update.id, id)).returning();

	if (!updated) return null;
	return mapToUpdatePost(updated);
}

export async function deleteUpdate(id: string): Promise<boolean> {
	const result = await db.delete(update).where(eq(update.id, id)).returning({ id: update.id });
	return result.length > 0;
}

export async function publishUpdate(id: string): Promise<UpdatePost | null> {
	return updateUpdate(id, { status: 'published' });
}

export async function unpublishUpdate(id: string): Promise<UpdatePost | null> {
	return updateUpdate(id, { status: 'draft' });
}

// ============================================================================
// Public API Functions (used by frontend)
// ============================================================================

export async function getPublishedPosts(limit = 10): Promise<UpdatePost[]> {
	return getPublishedUpdates(limit);
}

export async function getPostBySlug(slug: string): Promise<UpdatePost | null> {
	const post = await getUpdateBySlug(slug);
	// Only return if published (or allow drafts for preview)
	if (post && post.status === 'published') {
		return post;
	}
	return post; // Return even drafts for now - can add preview mode later
}

export async function getAllPosts(): Promise<UpdatePost[]> {
	return getPublishedUpdates(1000);
}
