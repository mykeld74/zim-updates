<script lang="ts">
	import type { Block } from '$lib/server/updates';
	import { renderLexicalContent } from '$lib/utils';
	import type { LexicalContent } from '$lib/utils';

	interface Props extends Block {
		body?: LexicalContent;
		content?: LexicalContent;
		richText?: LexicalContent;
	}

	let { body, content, richText }: Props = $props();

	const contentData = body || content || richText;
</script>

<div class="richTextBlock">
	{@html renderLexicalContent(contentData)}
</div>

<style>
	.richTextBlock {
		margin: var(--spacing-xl) 0;
	}

	.richTextBlock :global(p) {
		margin-bottom: var(--spacing-lg);
		line-height: 1.8;
		color: var(--textColor);
	}

	.richTextBlock :global(h2),
	.richTextBlock :global(h3),
	.richTextBlock :global(h4) {
		color: var(--primaryColor);
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
	}

	.richTextBlock :global(h2) {
		font-size: 2rem;
	}

	.richTextBlock :global(h3) {
		font-size: 1.5rem;
	}

	.richTextBlock :global(ul),
	.richTextBlock :global(ol) {
		margin-bottom: var(--spacing-lg);
		padding-left: var(--spacing-xl);
	}

	.richTextBlock :global(li) {
		margin-bottom: var(--spacing-sm);
		line-height: 1.6;
	}

	.richTextBlock :global(a) {
		color: var(--primaryColor);
		text-decoration: underline;
	}

	.richTextBlock :global(blockquote) {
		border-left: 4px solid var(--primaryColor);
		padding-left: var(--spacing-lg);
		margin: var(--spacing-xl) 0;
		font-style: italic;
		color: var(--textMuted);
	}

	.richTextBlock :global(code) {
		background: oklch(0.95 0.02 var(--hue));
		padding: 0.2em 0.4em;
		border-radius: var(--radius-sm);
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9em;
	}

	.richTextBlock :global(strong) {
		font-weight: 700;
	}

	.richTextBlock :global(em) {
		font-style: italic;
	}
</style>
