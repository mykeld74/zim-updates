<script lang="ts">
	import { Image, BlockRenderer } from '$lib';

	const { data } = $props();
	const post = $derived(data.post);

	const useBlocks = $derived(post.layout && post.layout.length > 0);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function renderLexicalContent(content: any) {
		// Lexical content renderer with support for various node types
		if (!content || !content.root) return '';

		function renderNode(node: any): string {
			if (!node) return '';

			// Text node with formatting
			if (node.text !== undefined) {
				let text = node.text;

				// Lexical format flags: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
				if (node.format) {
					if (node.format & 1) text = `<strong>${text}</strong>`; // bold
					if (node.format & 2) text = `<em>${text}</em>`; // italic
					if (node.format & 4) text = `<s>${text}</s>`; // strikethrough
					if (node.format & 8) text = `<u>${text}</u>`; // underline
					if (node.format & 16) text = `<code>${text}</code>`; // code
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
				const imageUrl = node.value?.url || node.src || '';
				const alt = node.value?.alt || node.alt || '';
				const width = node.value?.width || node.width || '';
				const height = node.value?.height || node.height || '';

				if (imageUrl) {
					return `<img src="${imageUrl}" alt="${alt}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''} loading="lazy" />`;
				}
				return '';
			}

			// Default: try to render children
			if (node.children) {
				return node.children.map(renderNode).join('');
			}

			return '';
		}

		const children = content.root.children || [];
		return children.map(renderNode).join('');
	}
</script>

<article class="postContainer">
	<header class="postHeader">
		<a href="/updates" class="backLink">← Back to Updates</a>

		<h1>{post.title}</h1>

		<div class="postMeta">
			<span class="date">{formatDate(post.createdAt)}</span>
		</div>
	</header>

	{#if post.featuredImage || post.featured_image}
		<div class="featuredImage">
			<Image source={post.featuredImage || post.featured_image} altTag={post.title} width="1200" />
		</div>
	{/if}

	<div class="postContent">
		{#if useBlocks}
			<!-- New blocks-based layout -->
			<BlockRenderer blocks={post.layout || []} />
		{:else if post.content}
			<!-- Legacy rich text content -->
			<div class="richText">
				{@html renderLexicalContent(post.content)}
			</div>
		{/if}
	</div>

	<footer class="postFooter">
		<a href="/updates" class="backToListButton">← Back to all updates</a>
	</footer>
</article>

<style>
	.hero {
		padding: 0;
		margin: 0;
	}
	.postContainer {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-2xl) var(--spacing-lg);
		animation: cardsIn var(--transition-base);
	}

	.postHeader {
		margin-bottom: var(--spacing-2xl);
	}

	.backLink {
		display: inline-block;
		color: var(--primaryColor);
		text-decoration: none;
		margin-bottom: var(--spacing-lg);
		font-weight: 500;
		transition: transform var(--transition-base);
	}

	.backLink:hover {
		transform: translateX(-4px);
	}

	.postHeader h1 {
		color: var(--primaryColor);
		font-size: clamp(2rem, 5vw, 3rem);
		margin-bottom: var(--spacing-md);
		line-height: 1.2;
	}

	.postMeta {
		color: var(--textMuted);
		font-size: 1rem;
	}

	.featuredImage {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-lg);
		overflow: hidden;
		margin-bottom: var(--spacing-2xl);
		box-shadow: var(--shadow-md);
	}

	.featuredImage :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.postContent {
		margin-bottom: var(--spacing-2xl);
	}

	.richText :global(p) {
		margin-bottom: var(--spacing-lg);
		line-height: 1.8;
		color: var(--textColor);
	}

	.richText :global(h2),
	.richText :global(h3),
	.richText :global(h4) {
		color: var(--primaryColor);
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
	}

	.richText :global(h2) {
		font-size: 2rem;
	}

	.richText :global(h3) {
		font-size: 1.5rem;
	}

	.richText :global(ul),
	.richText :global(ol) {
		margin-bottom: var(--spacing-lg);
		padding-left: var(--spacing-xl);
	}

	.richText :global(li) {
		margin-bottom: var(--spacing-sm);
		line-height: 1.6;
	}

	.richText :global(a) {
		color: var(--primaryColor);
		text-decoration: underline;
	}

	.richText :global(blockquote) {
		border-left: 4px solid var(--primaryColor);
		padding-left: var(--spacing-lg);
		margin: var(--spacing-xl) 0;
		font-style: italic;
		color: var(--textMuted);
	}

	.richText :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
		margin: var(--spacing-xl) auto;
		display: block;
		box-shadow: var(--shadow-sm);
	}

	.richText :global(code) {
		background: oklch(0.95 0.02 var(--hue));
		padding: 0.2em 0.4em;
		border-radius: var(--radius-sm);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9em;
	}

	.richText :global(strong) {
		font-weight: 700;
	}

	.richText :global(em) {
		font-style: italic;
	}

	.richText :global(u) {
		text-decoration: underline;
	}

	.richText :global(s) {
		text-decoration: line-through;
	}

	.postFooter {
		padding-top: var(--spacing-2xl);
		border-top: 1px solid oklch(0.8 0.02 var(--hue));
	}

	.backToListButton {
		display: inline-block;
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--primaryColor);
		color: var(--contrastColor);
		text-decoration: none;
		border-radius: var(--radius-md);
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.backToListButton:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
