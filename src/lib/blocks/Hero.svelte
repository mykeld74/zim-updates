<script lang="ts">
	import type { Block } from '$lib/server/updates';
	import { Image } from '$lib';

	interface Props extends Block {
		title?: string;
		subtitle?: string;
		heading?: string;
		subheading?: string;
		image?: string | { url: string };
		backgroundImage?: string;
		background_image?: string;
	}

	let { title, subtitle, heading, subheading, image, backgroundImage, background_image }: Props =
		$props();

	const heroTitle = title || heading;
	const heroSubtitle = subtitle || subheading;
	const heroImage =
		typeof image === 'string' ? image : image?.url || backgroundImage || background_image;
</script>

<section class="hero">
	{#if heroImage}
		<div class="heroBackground">
			<Image source={heroImage} altTag={heroTitle || 'Hero'} width="1600" />
		</div>
	{/if}

	<div class="heroContent">
		{#if heroTitle}
			<h1>{heroTitle}</h1>
		{/if}
		{#if heroSubtitle}
			<p class="subheading">{heroSubtitle}</p>
		{/if}
	</div>
</section>

<style>
	.hero {
		position: relative;

		display: grid;
		place-items: center;

		overflow: hidden;
		border-radius: var(--radius-lg);
	}

	.heroBackground {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.heroBackground :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.7);
	}

	.heroContent {
		position: relative;
		z-index: 1;
		text-align: center;
		color: white;
		max-width: 800px;
	}

	.hero h1 {
		font-size: clamp(2rem, 5vw, 4rem);
		margin-bottom: var(--spacing-md);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.subheading {
		font-size: clamp(1rem, 2vw, 1.5rem);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}
</style>
