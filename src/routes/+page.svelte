<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { Image } from '$lib';
	import type { UpdatePost, Block } from '$lib';

	const { data } = $props();

	const fallbackExcerpt = 'Catch up on the latest news from Zim Updates.';
	const excerptLimit = 180;

	function sanitizeText(text: string) {
		return text
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function truncate(text: string) {
		if (text.length <= excerptLimit) return text;
		return `${text.slice(0, excerptLimit - 1).trimEnd()}…`;
	}

	function extractText(block: Block) {
		const fields = ['excerpt', 'content', 'text', 'richText', 'description', 'body'];

		for (const field of fields) {
			const value = block[field];
			if (typeof value === 'string' && value.trim().length > 0) {
				return sanitizeText(value);
			}
		}

		return null;
	}

	function getExcerpt(post: UpdatePost) {
		if (post.excerpt && post.excerpt.trim().length > 0) {
			return truncate(sanitizeText(post.excerpt));
		}

		if (typeof post.content === 'string' && post.content.trim().length > 0) {
			return truncate(sanitizeText(post.content));
		}

		if (Array.isArray(post.layout)) {
			for (const block of post.layout) {
				const text = extractText(block);
				if (text && text.length > 0) {
					return truncate(text);
				}
			}
		}

		return truncate(fallbackExcerpt);
	}

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

	onMount(() => {
		let isMounted = true;
		let featuredTween: gsap.core.Tween | null = null;
		let recentTween: gsap.core.Tween | null = null;

		void data.posts.then(() => {
			if (!isMounted) return;

			featuredTween = gsap.from('.featuredCard', {
				opacity: 0,
				duration: 0.5,
				ease: 'power2.out'
			});

			if (featuredTween) {
				featuredTween.eventCallback('onComplete', () => {
					gsap.set('.featuredCard', { clearProps: 'opacity' });
				});
			}

			recentTween = gsap.from('.recentCard', {
				opacity: 0,
				duration: 0.5,
				delay: 0.1,
				stagger: 0.1,
				ease: 'power2.out'
			});

			if (recentTween) {
				recentTween.eventCallback('onComplete', () => {
					gsap.set('.recentCard', { clearProps: 'opacity' });
				});
			}
		});

		return () => {
			isMounted = false;
			if (featuredTween) {
				featuredTween.kill();
			}
			if (recentTween) {
				recentTween.kill();
			}
			gsap.set('.featuredCard', { clearProps: 'opacity' });
			gsap.set('.recentCard', { clearProps: 'opacity' });
		};
	});
</script>

<div class="fullScreen">
	<section class="hero" aria-label="Welcome">
		<div class="hero">
			<div class="heroText">
				<h1 class="headline">Welcome to Zim Updates</h1>
				<p class="subhead">Stay connected with our community</p>
			</div>
		</div>
	</section>

	<section class="latestUpdates" aria-labelledby="latest-updates-heading">
		{#await data.posts}
			<div class="updatesLoading">
				<p>Loading the newest updates...</p>
			</div>
		{:then posts}
			{#if posts.length > 0}
				{@const featuredPost = posts[0] as UpdatePost}
				<article class="featuredCard">
					<a class="featuredLink" href="/updates/{featuredPost.slug}">
						{#if featuredPost.featuredImage || featuredPost.featured_image}
							<div class="featuredMedia">
								<Image
									source={featuredPost.featuredImage || featuredPost.featured_image}
									altTag={featuredPost.title}
									width="960"
								/>
							</div>
						{/if}

						<div class="featuredContent">
							<span class="featuredBadge" aria-hidden="true">Latest Update</span>
							<h3>{featuredPost.title}</h3>
							<p>{getExcerpt(featuredPost)}</p>
							<div class="featuredMeta">
								<span>{featuredPost.author}</span>
								<span>{formatDate(featuredPost.createdAt || featuredPost.created_at)}</span>
							</div>
						</div>
					</a>
				</article>

				{#if posts.length > 1}
					{@const recentPosts = posts.slice(1, 4) as UpdatePost[]}
					<div class="recentGrid" role="list">
						{#each recentPosts as post (post.id)}
							<article class="recentCard" role="listitem">
								<a class="recentLink" href="/updates/{post.slug}">
									{#if post.featuredImage || post.featured_image}
										<div class="recentMedia">
											<Image
												source={post.featuredImage || post.featured_image}
												altTag={post.title}
												width="480"
											/>
										</div>
									{/if}

									<div class="recentContent">
										<h4>{post.title}</h4>
										<p class="excerpt">{getExcerpt(post)}</p>
										<div class="recentMeta">
											<span>{post.author}</span>
											<span>{formatDate(post.createdAt || post.created_at)}</span>
										</div>
									</div>
								</a>
							</article>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="updatesEmpty">
					<p>No updates yet. Check back soon.</p>
				</div>
			{/if}
		{:catch}
			<div class="updatesError">
				<p>We hit a snag loading updates. Please try again.</p>
			</div>
		{/await}
	</section>
</div>

<style>
	.fullScreen {
		width: 100%;
		height: 100vh;
		background:
			linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
			url('https://res.cloudinary.com/bigbeardeddev/image/upload/v1759930034/zim-admin/web/outdoorKitchen.jpg')
				no-repeat center center / cover fixed;
	}

	.hero {
		color: #fff;
		padding: 5vh 1vw;
		width: 100%;
		background-blend-mode: soft-light;
		display: grid;
		place-items: center;
		text-align: center;
		z-index: 500;
		font-size: calc(2.5vw + 0.75em);
	}
	.headline {
		font-size: 0.95em;
		text-shadow: 2px 2px 6px #000;
		margin: 0 0 0.5em 0;
		line-height: 1;
	}
	.subhead {
		font-size: 0.75em;
		text-shadow: 2px 2px 6px #000;
		margin: 0;
		line-height: 1;
	}
	.heroText {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: calc(100% - 40px);
	}

	.latestUpdates {
		padding: var(--spacing-2xl) var(--spacing-lg);
		display: grid;
		gap: var(--spacing-xl);
		max-width: 1200px;
		margin: 0 auto;
	}

	.excerpt {
		height: 120px;
	}

	.featuredCard {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--spacing-xl);
		background: var(--surfaceColor);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.featuredLink {
		display: contents;
		color: inherit;
		text-decoration: none;
	}

	.featuredMedia {
		position: relative;
		min-height: 240px;
	}

	.featuredMedia :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.featuredContent {
		padding: var(--spacing-xl);
		display: grid;
		gap: var(--spacing-md);
		align-content: center;
	}

	.featuredBadge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg) var(--spacing-lg);
		border-radius: var(--radius-md);
		background: oklch(0.88 0.04 240);
		color: #000;
		font-size: 2.25rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.featuredContent h3 {
		color: var(--primaryColor);
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2.25rem);
	}

	.featuredContent p {
		margin: 0;
		color: var(--textColor);
	}

	.featuredMeta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		color: var(--textMuted);
		font-size: 0.875rem;
	}

	.recentGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--spacing-lg);
	}

	.recentCard {
		display: grid;
		gap: var(--spacing-md);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition:
			transform var(--transition-base),
			box-shadow var(--transition-base);
	}

	.recentCard:hover {
		transform: translateY(-6px);
		box-shadow: var(--shadow-md);
	}

	.recentLink {
		display: contents;
		color: inherit;
	}

	.recentMedia {
		background: oklch(0.92 0.02 240);
		min-height: 200px;
	}

	.recentMedia :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.recentContent {
		padding: var(--spacing-lg);
		display: grid;
		gap: var(--spacing-sm);
	}

	.recentContent h4 {
		margin: 0;
		color: var(--primaryColor);
		font-size: clamp(1.125rem, 2.5vw, 1.5rem);
	}

	.recentContent p {
		margin: 0;
		color: var(--textColor);
	}

	.recentMeta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--textMuted);
		font-size: 0.875rem;
		padding-top: var(--spacing-sm);
		border-top: 1px solid oklch(0.85 0.02 240);
		gap: var(--spacing-sm);
	}

	.updatesLoading,
	.updatesEmpty,
	.updatesError {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--textMuted);
		font-style: italic;
	}

	.updatesError {
		color: var(--errorColor);
	}

	@media (max-width: 768px) {
		.featuredCard {
			grid-template-columns: 1fr;
		}
	}
</style>
