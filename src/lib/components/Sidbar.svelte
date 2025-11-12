<script lang="ts">
	import type { UpdatePost } from '$lib/server/updates';

	let { posts = [] }: { posts?: UpdatePost[] } = $props();

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="sidebar">
	<h2>Updates</h2>
	<nav class="postList">
		{#each posts as post}
			<a href="/updates/{post.slug}" class="postItem">
				<h3 class="postTitle">{post.title}</h3>
				<time class="postDate" datetime={post.createdAt || post.created_at}>
					{formatDate(post.createdAt || post.created_at)}
				</time>
			</a>
		{/each}
	</nav>
</div>

<style>
	.sidebar {
		width: 300px;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.7);
		border-right: 1px solid var(--borderColor);
		padding: var(--spacing-md);
		overflow-y: auto;
		position: fixed;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--spacing-md);
		color: var(--primaryColor);
	}

	.postList {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.postItem {
		display: block;
		padding: var(--spacing-sm);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: background-color 0.2s ease;
	}

	.postItem:hover {
		background-color: oklch(from var(--primaryColor) l c h / 0.1);
	}

	.postTitle {
		font-size: 0.95rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		line-height: 1.3;
	}

	.postDate {
		font-size: 0.75rem;
		color: oklch(from var(--contrastColor) l c h / 0.6);
		display: block;
	}
</style>
