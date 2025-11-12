<script lang="ts">
	import type { Block } from '$lib/server/updates';
	import type { ComponentType } from 'svelte';

	interface Props {
		blocks: Block[];
	}

	let { blocks }: Props = $props();

	// Map block types to their component loaders
	const componentLoaders: Record<string, () => Promise<any>> = {
		hero: () => import('$lib/blocks/Hero.svelte'),
		content: () => import('$lib/blocks/Content.svelte'),
		richText: () => import('$lib/blocks/Content.svelte'),
		image: () => import('$lib/blocks/ImageBlock.svelte'),
		callout: () => import('$lib/blocks/Callout.svelte')
	};

	// Helper to get the component loader
	function getComponentLoader(blockType: string) {
		return componentLoaders[blockType] || null;
	}
</script>

<div class="blockRenderer">
	{#each blocks as block (block.id)}
		{#if getComponentLoader(block.blockType)}
			{#await getComponentLoader(block.blockType)?.() then module}
				{#if module?.default}
					{@const Component = module.default}
					<Component {...block} />
				{:else}
					<div class="blockError">
						<p>Error loading block: {block.blockType}</p>
					</div>
				{/if}
			{:catch error}
				<div class="blockError">
					<p>Failed to load block: {block.blockType}</p>
					<p class="errorMessage">{error.message}</p>
				</div>
			{/await}
		{:else}
			<div class="blockError">
				<p>Unknown block type: {block.blockType}</p>
			</div>
		{/if}
	{/each}
</div>

<style>
	.blockRenderer {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.blockError {
		padding: var(--spacing-lg);
		background: oklch(0.95 0.05 20);
		border: 1px solid oklch(0.8 0.08 20);
		border-radius: var(--radius-md);
		color: oklch(0.4 0.15 20);
	}

	.blockError p {
		margin: 0;
	}

	.errorMessage {
		margin-top: var(--spacing-sm);
		font-size: 0.875rem;
		opacity: 0.8;
	}
</style>
