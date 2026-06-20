<script lang="ts">
	import { AdminImage } from '$lib';
	import { formatDate } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import type { UpdatePost } from '$lib/server/updates';

	const { data } = $props();

	let updates = $state<UpdatePost[]>(data.updates);
	let errorMessage = $state<string | null>(null);
	let filter = $state<'all' | 'published' | 'draft'>('all');

	// Keep local state in sync with server data
	$effect(() => {
		updates = data.updates;
	});

	const filteredUpdates = $derived(() => {
		if (filter === 'all') return updates;
		return updates.filter((u) => u.status === filter);
	});

	const stats = $derived(() => ({
		total: updates.length,
		published: updates.filter((u) => u.status === 'published').length,
		draft: updates.filter((u) => u.status === 'draft').length
	}));

	async function toggleStatus(update: UpdatePost) {
		errorMessage = null;
		const action = update.status === 'published' ? 'unpublish' : 'publish';

		try {
			const response = await fetch(`/api/updates/${update.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.error || `Failed to ${action} update`;
			}
		} catch (err) {
			console.error(`Error ${action}ing update:`, err);
			errorMessage = `An error occurred while trying to ${action}`;
		}
	}

	async function deleteUpdate(id: string, title: string) {
		if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

		errorMessage = null;
		try {
			const response = await fetch(`/api/updates/${id}`, { method: 'DELETE' });

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to delete update';
			}
		} catch (err) {
			console.error('Error deleting update:', err);
			errorMessage = 'An error occurred while deleting';
		}
	}
</script>

<svelte:head>
	<title>Updates Management - Admin - Zim Updates</title>
	<meta name="description" content="Create and manage blog posts and updates in the admin panel." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="updatesPage">
	<div class="header">
		<div>
			<h2>Updates Management</h2>
			<p class="subtitle">Create and manage your updates and blog posts</p>
		</div>
		<a href="/admin/updates/new" class="primaryButton">+ New Update</a>
	</div>

	{#if errorMessage}
		<div class="errorBanner" role="alert">
			<p>{errorMessage}</p>
			<button onclick={() => (errorMessage = null)} class="dismissButton">Dismiss</button>
		</div>
	{/if}

	<div class="statsBar">
		<button class="statItem" class:active={filter === 'all'} onclick={() => (filter = 'all')}>
			<span class="statNumber">{stats().total}</span>
			<span class="statLabel">Total</span>
		</button>
		<button
			class="statItem published"
			class:active={filter === 'published'}
			onclick={() => (filter = 'published')}
		>
			<span class="statNumber">{stats().published}</span>
			<span class="statLabel">Published</span>
		</button>
		<button
			class="statItem draft"
			class:active={filter === 'draft'}
			onclick={() => (filter = 'draft')}
		>
			<span class="statNumber">{stats().draft}</span>
			<span class="statLabel">Drafts</span>
		</button>
	</div>

	{#if filteredUpdates().length > 0}
		<div class="updatesList">
			{#each filteredUpdates() as update (update.id)}
				<article class="updateCard">
					<div class="updateImage">
						{#if update.featuredImage}
							<AdminImage
								source={update.featuredImage}
								altTag={update.title}
								width="300"
								aspectRatio="3:2"
								faceCrop={true}
							/>
						{:else}
							<div class="placeholderImage">
								<span>📝</span>
							</div>
						{/if}
					</div>

					<div class="updateInfo">
						<div class="updateHeader">
							<h3>
								<a href="/admin/updates/{update.id}">{update.title}</a>
							</h3>
							<span class="statusBadge" class:published={update.status === 'published'}>
								{update.status}
							</span>
						</div>

						{#if update.excerpt}
							<p class="excerpt">{update.excerpt}</p>
						{/if}

						<div class="updateMeta">
							<span class="author">By {update.author}</span>
							<span class="date">Created {formatDate(update.createdAt)}</span>
							{#if update.publishedAt}
								<span class="date">Published {formatDate(update.publishedAt)}</span>
							{/if}
						</div>
					</div>

					<div class="updateActions">
						<a href="/admin/updates/{update.id}" class="editButton">Edit</a>
						<button class="statusButton" onclick={() => toggleStatus(update)}>
							{update.status === 'published' ? 'Unpublish' : 'Publish'}
						</button>
						<a href="/updates/{update.slug}" class="viewButton" target="_blank">View</a>
						<button class="deleteButton" onclick={() => deleteUpdate(update.id, update.title)}>
							Delete
						</button>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="emptyState">
			{#if filter !== 'all'}
				<p>No {filter} updates found.</p>
				<button class="secondaryButton" onclick={() => (filter = 'all')}>Show all updates</button>
			{:else}
				<p>No updates yet. Create your first update to get started.</p>
				<a href="/admin/updates/new" class="primaryButton">Create First Update</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.updatesPage {
		animation: cardsIn var(--transition-base);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-xl);
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.subtitle {
		color: var(--textMuted);
	}

	.primaryButton {
		display: inline-block;
		background: var(--primaryColor);
		color: var(--contrastColor);
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all var(--transition-base);
	}

	.primaryButton:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	.secondaryButton {
		background: transparent;
		color: var(--primaryColor);
		padding: var(--spacing-sm) var(--spacing-lg);
		border: 1px solid var(--primaryColor);
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.secondaryButton:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.errorBanner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		background: oklch(0.95 0.05 20);
		color: oklch(0.4 0.15 20);
		border: 1px solid oklch(0.8 0.08 20);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
	}

	.errorBanner p {
		margin: 0;
	}

	.dismissButton {
		background: transparent;
		border: 1px solid currentColor;
		color: inherit;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.statsBar {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
		flex-wrap: wrap;
	}

	.statItem {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-xl);
		background: var(--surfaceColor);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		min-width: 100px;
	}

	.statItem:hover {
		border-color: var(--primaryColor);
	}

	.statItem.active {
		border-color: var(--primaryColor);
		background: oklch(from var(--primaryColor) l c h / 0.1);
	}

	.statNumber {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primaryColor);
	}

	.statItem.published .statNumber {
		color: oklch(0.55 0.15 140);
	}

	.statItem.draft .statNumber {
		color: oklch(0.6 0.15 60);
	}

	.statLabel {
		font-size: 0.875rem;
		color: var(--textMuted);
	}

	.updatesList {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.updateCard {
		display: grid;
		grid-template-columns: 150px 1fr auto;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
	}

	.updateCard:hover {
		box-shadow: var(--shadow-md);
	}

	.updateImage {
		width: 150px;
		height: 100px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--backgroundColor);
	}

	.updateImage :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholderImage {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		background: var(--backgroundColor);
	}

	.updateInfo {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.updateHeader {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	.updateHeader h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	.updateHeader h3 a {
		color: var(--primaryColor);
		text-decoration: none;
	}

	.updateHeader h3 a:hover {
		text-decoration: underline;
	}

	.statusBadge {
		display: inline-block;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		background: oklch(0.95 0.1 60);
		color: oklch(0.4 0.15 60);
	}

	.statusBadge.published {
		background: oklch(0.95 0.1 140);
		color: oklch(0.4 0.15 140);
	}

	.excerpt {
		color: var(--textMuted);
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.updateMeta {
		display: flex;
		gap: var(--spacing-md);
		font-size: 0.8rem;
		color: var(--textMuted);
		flex-wrap: wrap;
	}

	.updateActions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		justify-content: center;
	}

	.editButton,
	.statusButton,
	.viewButton,
	.deleteButton {
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: center;
		text-decoration: none;
		border: none;
	}

	.editButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.statusButton {
		background: oklch(0.95 0.1 140);
		color: oklch(0.4 0.15 140);
	}

	.viewButton {
		background: var(--backgroundColor);
		color: var(--textColor);
		border: 1px solid var(--borderColor);
	}

	.deleteButton {
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
	}

	.editButton:hover,
	.statusButton:hover,
	.viewButton:hover,
	.deleteButton:hover {
		opacity: 0.8;
	}

	.emptyState {
		text-align: center;
		padding: var(--spacing-2xl);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.emptyState p {
		color: var(--textMuted);
		margin: 0;
	}

	@media (max-width: 768px) {
		.updateCard {
			grid-template-columns: 1fr;
		}

		.updateImage {
			width: 100%;
			height: 150px;
		}

		.updateActions {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
</style>
