<script lang="ts">
	import type { Block } from '$lib/server/updates';
	import { Image } from '$lib';

	interface Props extends Block {
		media?: { url: string; alt?: string };
		image?: string | { url: string };
		caption?: string;
		width?: 'full' | 'wide' | 'normal';
	}

	let { media, image, caption, width = 'normal' }: Props = $props();

	const imageUrl = media?.url || (typeof image === 'string' ? image : image?.url || '');
	const imageAlt = media?.alt || caption || 'Image';
	const widthClass = width;
</script>

<figure class="imageBlock {widthClass}">
	{#if imageUrl}
		<Image source={imageUrl} altTag={imageAlt} width="auto" />
	{/if}
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>

<style>
	.imageBlock {
		margin: var(--spacing-2xl) 0;
	}

	.imageBlock.normal {
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.imageBlock.wide {
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	.imageBlock.full {
		width: 100%;
	}

	.imageBlock :global(img) {
		width: 100%;
		height: auto;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
	}

	figcaption {
		margin-top: var(--spacing-sm);
		text-align: center;
		color: var(--textMuted);
		font-size: 0.9rem;
		font-style: italic;
	}
</style>
