<script lang="ts">
	import { Image, BlockRenderer } from '$lib';
	import { formatDate, renderLexicalContent } from '$lib/utils';

	const { data } = $props();
	const post = $derived(data.post);

	const useBlocks = $derived(post.layout && post.layout.length > 0);
	const featuredImageSrc = $derived(post.featuredImage || post.featured_image);
</script>

<article class="postContainer">
	<header class="postHeader">
		<a href="/updates" class="backLink">← Back to Updates</a>

		<h1>{post.title}</h1>

		<div class="postMeta">
			<span class="date">{formatDate(post.createdAt)}</span>
		</div>
	</header>

	{#if featuredImageSrc}
		<div class="featuredImage">
			<Image source={featuredImageSrc} altTag={post.title} width="1200" />
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
