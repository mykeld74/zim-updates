<script lang="ts">
	import { Image } from '$lib';

	const { data } = $props();

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'No date';

		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'Invalid date';

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="updatesContainer">
	<header class="updatesHeader">
		<h1>Updates</h1>
		<p class="subtitle">Latest news and stories from Zim</p>
	</header>

	{#await data.posts}
		<div class="loadingState">
			<p>Loading updates...</p>
		</div>
	{:then posts}
		<div class="postsGrid">
			{#each posts as post (post.id)}
				<article class="postCard">
					<a href="/updates/{post.slug}" class="postLink">
						{#if post.featuredImage || post.featured_image}
							<div class="imageContainer">
								<Image
									source={post.featuredImage || post.featured_image}
									altTag={post.title}
									width="600"
								/>
							</div>
						{/if}

						<div class="postContent">
							<h2>{post.title}</h2>
							<p class="excerpt">{post.excerpt}</p>

							<div class="postMeta">
								<span class="author">{post.author}</span>

								<span class="date">{formatDate(post.createdAt)}</span>
							</div>
						</div>
					</a>
				</article>
			{/each}
		</div>

		{#if posts.length === 0}
			<div class="emptyState">
				<p>No updates yet. Check back soon!</p>
			</div>
		{/if}
	{:catch error}
		<div class="errorState">
			<p>Error loading updates. Please try again later.</p>
		</div>
	{/await}
</div>

<style>
	.updatesContainer {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-2xl) var(--spacing-lg);
		animation: cardsIn var(--transition-base);
	}

	.updatesHeader {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
	}

	.updatesHeader h1 {
		color: var(--primaryColor);
		font-size: clamp(2rem, 5vw, 3rem);
		margin-bottom: var(--spacing-sm);
	}

	.subtitle {
		color: var(--textMuted);
		font-size: clamp(1rem, 2vw, 1.25rem);
	}

	.postsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: var(--spacing-xl);
	}

	.postCard {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
	}

	.postCard:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-4px);
	}

	.postLink {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.imageContainer {
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: oklch(0.9 0.02 var(--hue));
	}

	.imageContainer :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.postContent {
		padding: var(--spacing-lg);
	}

	.postContent h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-md);
		font-size: clamp(1.25rem, 2vw, 1.5rem);
	}

	.excerpt {
		color: var(--textColor);
		margin-bottom: var(--spacing-md);
		line-height: 1.6;
	}

	.postMeta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-md);
		border-top: 1px solid oklch(0.8 0.02 var(--hue));
		font-size: 0.875rem;
		color: var(--textMuted);
	}

	.author {
		font-weight: 500;
	}

	.emptyState,
	.loadingState,
	.errorState {
		text-align: center;
		padding: var(--spacing-2xl);
		color: var(--textMuted);
		font-style: italic;
	}

	.loadingState {
		animation: pulse 2s ease-in-out infinite;
	}

	.errorState {
		color: oklch(0.5 0.15 20);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
