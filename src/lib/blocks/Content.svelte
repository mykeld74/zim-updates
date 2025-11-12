<script lang="ts">
	import type { Block } from '$lib/server/updates';

	interface Props extends Block {
		body?: any;
		content?: any;
		richText?: any;
	}

	let { body, content, richText }: Props = $props();

	function renderLexicalContent(content: any) {
		if (!content || !content.root) return '';

		function renderNode(node: any): string {
			if (!node) return '';

			if (node.text !== undefined) {
				let text = node.text;
				if (node.format) {
					if (node.format & 1) text = `<strong>${text}</strong>`;
					if (node.format & 2) text = `<em>${text}</em>`;
					if (node.format & 4) text = `<s>${text}</s>`;
					if (node.format & 8) text = `<u>${text}</u>`;
					if (node.format & 16) text = `<code>${text}</code>`;
				}
				return text;
			}

			if (node.type === 'paragraph') {
				const content = node.children?.map(renderNode).join('') || '';
				return `<p>${content}</p>`;
			}

			if (node.type === 'heading') {
				const content = node.children?.map(renderNode).join('') || '';
				const tag = node.tag || 'h2';
				return `<${tag}>${content}</${tag}>`;
			}

			if (node.type === 'list' && node.listType === 'bullet') {
				const items = node.children?.map(renderNode).join('') || '';
				return `<ul>${items}</ul>`;
			}

			if (node.type === 'list' && node.listType === 'number') {
				const items = node.children?.map(renderNode).join('') || '';
				return `<ol>${items}</ol>`;
			}

			if (node.type === 'listitem') {
				const content = node.children?.map(renderNode).join('') || '';
				return `<li>${content}</li>`;
			}

			if (node.type === 'link') {
				const content = node.children?.map(renderNode).join('') || '';
				const url = node.url || '#';
				return `<a href="${url}">${content}</a>`;
			}

			if (node.type === 'quote') {
				const content = node.children?.map(renderNode).join('') || '';
				return `<blockquote>${content}</blockquote>`;
			}

			if (node.children) {
				return node.children.map(renderNode).join('');
			}

			return '';
		}

		const children = content.root.children || [];
		return children.map(renderNode).join('');
	}

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
