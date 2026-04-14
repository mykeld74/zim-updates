<script lang="ts">
	import { AdminImage } from '$lib';
	import { formatDate, formatKidDisplayName } from '$lib/utils';

	const { data } = $props();

	const kid = $derived(data.kid);
</script>

<svelte:head>
	<title>{formatKidDisplayName(kid.name, kid.nickname)} — My sponsorship</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="kidDetail">
	<p class="back">
		<a href="/sponsor">← Back to my sponsorship</a>
	</p>

	<header class="header">
		<div class="hero">
			{#if kid.featuredImage || kid.image}
				<AdminImage
					source={(kid.featuredImage || kid.image) ?? ''}
					altTag={formatKidDisplayName(kid.name, kid.nickname)}
					width="600"
					height="600"
					faceCrop={true}
					class="heroAvatar"
				/>
			{/if}
		</div>
		<div class="intro">
			<h1>{formatKidDisplayName(kid.name, kid.nickname)}</h1>
			{#if kid.tagline}
				<p class="tagline">{kid.tagline}</p>
			{/if}
			<dl class="facts">
				{#if kid.birthday}
					<div>
						<dt>Birthday</dt>
						<dd>{formatDate(kid.birthday ? kid.birthday.toISOString() : null)}</dd>
					</div>
				{/if}
				{#if kid.gender}
					<div>
						<dt>Gender</dt>
						<dd>{kid.gender}</dd>
					</div>
				{/if}
			</dl>
		</div>
	</header>

	{#if data.descriptionHtml}
		<section class="description prose" aria-label="About">
			{@html data.descriptionHtml}
		</section>
	{/if}

	{#if kid.images && kid.images.length > 0}
		<section class="gallery" aria-label="Photos">
			<h2>Photos</h2>
			<div class="thumbs">
				{#each kid.images as src (src)}
					<AdminImage
						source={src}
						altTag={`${formatKidDisplayName(kid.name, kid.nickname)} — photo`}
						width="900"
						height="auto"
						class="thumb"
					/>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.kidDetail {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--spacing-xl) var(--spacing-lg);
	}

	.back {
		margin: 0 0 var(--spacing-lg);
	}

	.back a {
		color: var(--primaryColor);
		text-decoration: none;
		font-weight: 500;
	}

	.back a:hover {
		text-decoration: underline;
	}

	.header {
		display: grid;
		gap: var(--spacing-xl);
		margin-bottom: var(--spacing-2xl);
	}

	@media (min-width: 720px) {
		.header {
			grid-template-columns: 1fr 1fr;
			align-items: center;
		}
	}

	.hero {
		width: min(300px, 100%);
		aspect-ratio: 1;
		flex-shrink: 0;
	}

	@media (min-width: 720px) {
		.hero {
			justify-self: start;
		}
	}

	.hero :global(.heroAvatar) {
		width: 100%;
		height: 100%;
		max-width: none;
		border-radius: 50%;
		display: block;
		object-fit: cover;
	}

	.intro h1 {
		color: var(--primaryColor);
		margin: 0 0 var(--spacing-sm);
	}

	.tagline {
		color: var(--textMuted);
		font-size: 1.05rem;
		line-height: 1.5;
		margin: 0 0 var(--spacing-lg);
	}

	.facts {
		margin: 0;
		display: grid;
		gap: var(--spacing-md);
	}

	.facts dt {
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--textMuted);
	}

	.facts dd {
		margin: 0.15rem 0 0;
	}

	.description {
		margin-bottom: var(--spacing-2xl);
		line-height: 1.6;
		color: var(--textColor);
	}

	.description :global(p) {
		margin: 0 0 var(--spacing-md);
	}

	.gallery h2 {
		font-size: 1.125rem;
		margin-bottom: var(--spacing-md);
	}

	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		align-items: flex-start;
	}

	.thumbs :global(.thumb) {
		max-width: min(100%, 18rem);
		width: auto;
		height: auto;
		border-radius: var(--radius-md);
		vertical-align: middle;
	}
</style>
