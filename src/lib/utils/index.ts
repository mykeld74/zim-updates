/**
 * Shared utility functions for the Zim Updates application
 */

// ============================================================================
// Date Formatting
// ============================================================================

export interface DateFormatOptions {
	year?: 'numeric' | '2-digit';
	month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
	day?: 'numeric' | '2-digit';
}

const defaultDateOptions: DateFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric'
};

const shortDateOptions: DateFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric'
};

/**
 * Format a date string for display
 * @param dateString - ISO date string or Date-parseable string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or fallback text
 */
export function formatDate(
	dateString: string | undefined | null,
	options: DateFormatOptions = defaultDateOptions
): string {
	if (!dateString) return 'No date';

	const date = new Date(dateString);
	if (isNaN(date.getTime())) return 'Invalid date';

	return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date string with short month format
 */
export function formatDateShort(dateString: string | undefined | null): string {
	return formatDate(dateString, shortDateOptions);
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID using crypto.randomUUID
 * Falls back to timestamp-based ID if crypto is unavailable
 */
export function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for environments without crypto.randomUUID
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Sanitize HTML from text content
 */
export function sanitizeText(text: string): string {
	return text
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncate(text: string, limit: number = 180): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit - 1).trimEnd()}…`;
}

// ============================================================================
// Lexical Content Rendering
// ============================================================================

interface LexicalNode {
	type?: string;
	text?: string;
	format?: number;
	tag?: string;
	listType?: 'bullet' | 'number';
	url?: string;
	src?: string;
	alt?: string;
	width?: number;
	height?: number;
	value?:
		| string
		| {
				url?: string;
				alt?: string;
				width?: number;
				height?: number;
		  };
	children?: LexicalNode[];
}

interface LexicalContent {
	root?: {
		children?: LexicalNode[];
	};
}

/**
 * Render a single Lexical node to HTML
 */
function renderNode(node: LexicalNode): string {
	if (!node) return '';

	// Raw HTML content (from RichTextEditor)
	if (node.type === 'html' && typeof node.value === 'string') {
		return node.value;
	}

	// Text node with formatting
	if (node.text !== undefined) {
		let text = node.text;

		// Lexical format flags: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
		if (node.format) {
			if (node.format & 1) text = `<strong>${text}</strong>`;
			if (node.format & 2) text = `<em>${text}</em>`;
			if (node.format & 4) text = `<s>${text}</s>`;
			if (node.format & 8) text = `<u>${text}</u>`;
			if (node.format & 16) text = `<code>${text}</code>`;
		}

		return text;
	}

	// Paragraph
	if (node.type === 'paragraph') {
		const content = node.children?.map(renderNode).join('') || '';
		return `<p>${content}</p>`;
	}

	// Heading
	if (node.type === 'heading') {
		const content = node.children?.map(renderNode).join('') || '';
		const tag = node.tag || 'h2';
		return `<${tag}>${content}</${tag}>`;
	}

	// List (unordered)
	if (node.type === 'list' && node.listType === 'bullet') {
		const items = node.children?.map(renderNode).join('') || '';
		return `<ul>${items}</ul>`;
	}

	// List (ordered)
	if (node.type === 'list' && node.listType === 'number') {
		const items = node.children?.map(renderNode).join('') || '';
		return `<ol>${items}</ol>`;
	}

	// List item
	if (node.type === 'listitem') {
		const content = node.children?.map(renderNode).join('') || '';
		return `<li>${content}</li>`;
	}

	// Link
	if (node.type === 'link') {
		const content = node.children?.map(renderNode).join('') || '';
		const url = node.url || '#';
		return `<a href="${url}">${content}</a>`;
	}

	// Quote/Blockquote
	if (node.type === 'quote') {
		const content = node.children?.map(renderNode).join('') || '';
		return `<blockquote>${content}</blockquote>`;
	}

	// Image
	if (node.type === 'upload' || node.type === 'image') {
		const valueObj = typeof node.value === 'object' ? node.value : null;
		const imageUrl = valueObj?.url || node.src || '';
		const alt = valueObj?.alt || node.alt || '';
		const width = valueObj?.width || node.width || '';
		const height = valueObj?.height || node.height || '';

		if (imageUrl) {
			const widthAttr = width ? ` width="${width}"` : '';
			const heightAttr = height ? ` height="${height}"` : '';
			return `<img src="${imageUrl}" alt="${alt}"${widthAttr}${heightAttr} loading="lazy" />`;
		}
		return '';
	}

	// Default: try to render children
	if (node.children) {
		return node.children.map(renderNode).join('');
	}

	return '';
}

/**
 * Render Lexical content to HTML string
 * @param content - Lexical JSON content object
 * @returns HTML string
 */
export function renderLexicalContent(content: LexicalContent | null | undefined): string {
	if (!content || !content.root) return '';

	const children = content.root.children || [];
	return children.map(renderNode).join('');
}

// ============================================================================
// Type exports for external use
// ============================================================================

export type { LexicalContent, LexicalNode };
