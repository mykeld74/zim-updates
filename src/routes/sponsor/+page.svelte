<script lang="ts">
	import { AdminImage } from '$lib';
	import { formatDate, formatKidDisplayName } from '$lib/utils';

	const { data } = $props();

	const sponsor = $derived(data.sponsor);
</script>

<svelte:head>
	<title>My sponsorship — Zimbabwe Updates</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="sponsorPage">
	<header class="pageHeader">
		<h1>My sponsorship</h1>
		{#if sponsor}
			<p class="lead">
				{sponsor.firstName}
				{sponsor.lastName} — you are connected as a sponsor when we match your account email to our
				records.
			</p>
		{/if}
	</header>

	{#if !sponsor || sponsor.kids.length === 0}
		<div class="emptyState">
			<p>
				You do not have any sponsored children linked to this account yet. When your sponsorship is
				connected in our system, their profiles will appear here.
			</p>
			<p class="hint">Questions? Contact the team that manages Zimbabwe Updates.</p>
		</div>
	{:else}
		<ul class="kidGrid">
			{#each sponsor.kids as kid (kid.id)}
				<li class="kidCard">
					<a href="/sponsor/kids/{kid.id}" class="cardLink">
						<div class="imageWrap">
							{#if kid.image || kid.featuredImage}
								<AdminImage
									source={(kid.featuredImage || kid.image) ?? ''}
									altTag={formatKidDisplayName(kid.name, kid.nickname)}
									width="400"
									height="280"
									faceCrop={true}
								/>
							{:else}
								<div class="imagePlaceholder" aria-hidden="true">No photo</div>
							{/if}
						</div>
						<div class="cardBody">
							<h2 class="kidName">{formatKidDisplayName(kid.name, kid.nickname)}</h2>
							{#if kid.tagline}
								<p class="tagline">{kid.tagline}</p>
							{/if}
							{#if kid.birthday}
								<p class="meta">
									Birthday: {formatDate(kid.birthday ? kid.birthday.toISOString() : null)}
								</p>
							{/if}
							{#if kid.gender}
								<p class="meta">{kid.gender}</p>
							{/if}
							<span class="viewLink">View profile</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sponsorPage {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-xl) var(--spacing-lg);
	}

	.pageHeader {
		margin-bottom: var(--spacing-2xl);
	}

	h1 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.lead {
		color: var(--textMuted);
		max-width: 42rem;
		line-height: 1.5;
	}

	.emptyState {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		padding: var(--spacing-2xl);
		box-shadow: var(--shadow-sm);
	}

	.hint {
		margin-top: var(--spacing-md);
		color: var(--textMuted);
		font-size: 0.9375rem;
	}

	.kidGrid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--spacing-xl);
	}

	.kidCard {
		margin: 0;
	}

	.cardLink {
		display: block;
		text-decoration: none;
		color: inherit;
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		transition:
			transform var(--transition-base),
			box-shadow var(--transition-base);
		height: 100%;
	}

	.cardLink:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.imageWrap {
		aspect-ratio: 4 / 3;
		background: oklch(from var(--textMuted) l c h / 0.12);
	}

	.imageWrap :global(.adminImage) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.imagePlaceholder {
		display: grid;
		place-items: center;
		height: 100%;
		color: var(--textMuted);
		font-size: 0.875rem;
	}

	.cardBody {
		padding: var(--spacing-lg);
	}

	.kidName {
		font-size: 1.25rem;
		margin: 0 0 var(--spacing-xs);
		color: var(--primaryColor);
	}

	.tagline {
		margin: 0 0 var(--spacing-sm);
		color: var(--textMuted);
		font-size: 0.9375rem;
		line-height: 1.4;
	}

	.meta {
		margin: 0;
		font-size: 0.875rem;
		color: var(--textMuted);
	}

	.viewLink {
		display: inline-block;
		margin-top: var(--spacing-md);
		font-weight: 600;
		color: var(--primaryColor);
	}
</style>
