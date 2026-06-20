<script lang="ts">
	import { goto } from '$app/navigation';
	import { AdminImage } from '$lib';
	import { formatDate } from '$lib/utils';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import type { UpdatePost } from '$lib/server/updates';

	const { data } = $props();

	// Extract initial content from Lexical format
	function extractHtmlContent(update: UpdatePost): string {
		if (update.content?.root?.children) {
			const children = update.content.root.children as Array<{ type?: string; value?: string }>;
			const htmlNode = children.find((c) => c.type === 'html');
			if (htmlNode?.value) {
				return htmlNode.value;
			}
		}
		return '';
	}

	// Form state - initialized once from data
	let title = $state(data.update.title);
	let slug = $state(data.update.slug);
	let excerpt = $state(data.update.excerpt || '');
	let content = $state(extractHtmlContent(data.update));
	let featuredImage = $state(data.update.featuredImage || '');
	let author = $state(data.update.author);
	let status = $state<'draft' | 'published'>(data.update.status);

	let saving = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let showImageUpload = $state(false);

	// Keep track of the update for display purposes only (not for form sync)
	const update = $derived(data.update);

	async function handleSave(publish: boolean = false) {
		if (!title.trim()) {
			errorMessage = 'Title is required';
			return;
		}

		saving = true;
		errorMessage = null;
		successMessage = null;

		try {
			const response = await fetch(`/api/updates/${update.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					slug: slug.trim(),
					excerpt: excerpt.trim() || null,
					content: content ? { root: { children: [{ type: 'html', value: content }] } } : null,
					featuredImage: featuredImage || null,
					author: author.trim(),
					status: publish ? 'published' : status
				})
			});

			const result = await response.json();

			if (response.ok) {
				// Update local state with saved values
				status = result.update.status;
				successMessage = 'Update saved successfully';
				setTimeout(() => (successMessage = null), 3000);
			} else {
				errorMessage = result.error || 'Failed to save update';
			}
		} catch (err) {
			console.error('Error saving:', err);
			errorMessage = 'An error occurred while saving';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

		saving = true;
		errorMessage = null;

		try {
			const response = await fetch(`/api/updates/${update.id}`, { method: 'DELETE' });

			if (response.ok) {
				goto('/admin/updates');
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to delete update';
			}
		} catch (err) {
			console.error('Error deleting:', err);
			errorMessage = 'An error occurred while deleting';
		} finally {
			saving = false;
		}
	}

	function handleImageUpload(publicId: string) {
		featuredImage = publicId;
		showImageUpload = false;
	}

	function removeImage() {
		featuredImage = '';
	}
</script>

<svelte:head>
	<title>Edit Update - Admin - Zim Updates</title>
	<meta name="description" content="Edit update post in the admin panel." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="editorPage">
	<div class="editorHeader">
		<a href="/admin/updates" class="backLink">← Back to Updates</a>
		<div class="headerRow">
			<h1>Edit Update</h1>
			<span class="statusBadge" class:published={status === 'published'}>{status}</span>
		</div>
		<p class="metaInfo">
			Created {formatDate(update.createdAt)}
			{#if update.publishedAt}
				• Published {formatDate(update.publishedAt)}
			{/if}
		</p>
	</div>

	{#if errorMessage}
		<div class="errorBanner" role="alert">
			<p>{errorMessage}</p>
			<button onclick={() => (errorMessage = null)} class="dismissButton">Dismiss</button>
		</div>
	{/if}

	{#if successMessage}
		<div class="successBanner" role="status">
			<p>{successMessage}</p>
		</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<div class="editorLayout">
			<div class="mainColumn">
				<div class="formGroup">
					<label for="title">Title *</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						required
						placeholder="Enter update title"
						class="titleInput"
					/>
				</div>

				<div class="formGroup">
					<label for="slug">Slug</label>
					<div class="slugInput">
						<span class="slugPrefix">/updates/</span>
						<input type="text" id="slug" bind:value={slug} placeholder="url-friendly-slug" />
					</div>
				</div>

				<div class="formGroup">
					<label for="excerpt">Excerpt</label>
					<textarea
						id="excerpt"
						bind:value={excerpt}
						placeholder="Brief summary of the update (shown in listings)"
						rows="3"
					></textarea>
				</div>

				<div class="formGroup">
					<label for="content-editor">Content</label>
					<RichTextEditor
						{content}
						onchange={(html) => (content = html)}
						placeholder="Write your update content here..."
					/>
				</div>
			</div>

			<div class="sideColumn">
				<div class="sideCard">
					<h3>Publish</h3>
					<div class="formGroup">
						<label for="status">Status</label>
						<select id="status" bind:value={status}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
						</select>
					</div>

					<div class="publishActions">
						<button type="submit" class="saveButton" disabled={saving}>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>
						{#if status === 'draft'}
							<button
								type="button"
								class="publishButton"
								disabled={saving}
								onclick={() => handleSave(true)}
							>
								Save & Publish
							</button>
						{/if}
					</div>

					<div class="viewLink">
						<a href="/updates/{slug}" target="_blank">View on site →</a>
					</div>
				</div>

				<div class="sideCard">
					<h3>Featured Image</h3>
					{#if featuredImage && !showImageUpload}
						<div class="imagePreview">
							<AdminImage
								source={featuredImage}
								altTag="Featured image"
								width="300"
								aspectRatio="16:9"
								faceCrop={true}
							/>
							<button type="button" class="removeImageBtn" onclick={removeImage}>Remove</button>
							<button
								type="button"
								class="changeImageBtn"
								onclick={() => (showImageUpload = true)}
							>
								Change Image
							</button>
						</div>
					{:else if showImageUpload}
						<ImagePicker
							folder="zim-admin/updates"
							tags={['update-featured']}
							onSelect={handleImageUpload}
							onCancel={() => (showImageUpload = false)}
						/>
					{:else}
						<button type="button" class="addImageBtn" onclick={() => (showImageUpload = true)}>
							+ Add Featured Image
						</button>
					{/if}
				</div>

				<div class="sideCard">
					<h3>Author</h3>
					<div class="formGroup">
						<input type="text" bind:value={author} placeholder="Author name" />
					</div>
				</div>

				<div class="sideCard danger">
					<h3>Danger Zone</h3>
					<button type="button" class="deleteButton" onclick={handleDelete} disabled={saving}>
						Delete Update
					</button>
				</div>
			</div>
		</div>
	</form>
</div>

<style>
	.editorPage {
		animation: cardsIn var(--transition-base);
		max-width: 1400px;
		margin: 0 auto;
	}

	.editorHeader {
		margin-bottom: var(--spacing-xl);
	}

	.backLink {
		display: inline-block;
		color: var(--primaryColor);
		text-decoration: none;
		margin-bottom: var(--spacing-md);
		font-weight: 500;
		transition: transform var(--transition-base);
	}

	.backLink:hover {
		transform: translateX(-4px);
	}

	.headerRow {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	h1 {
		color: var(--primaryColor);
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2rem);
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

	.metaInfo {
		color: var(--textMuted);
		margin: var(--spacing-sm) 0 0;
		font-size: 0.9rem;
	}

	.errorBanner,
	.successBanner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
	}

	.errorBanner {
		background: oklch(0.95 0.05 20);
		color: oklch(0.4 0.15 20);
		border: 1px solid oklch(0.8 0.08 20);
	}

	.successBanner {
		background: oklch(0.95 0.1 140);
		color: oklch(0.4 0.15 140);
		border: 1px solid oklch(0.8 0.1 140);
	}

	.errorBanner p,
	.successBanner p {
		margin: 0;
	}

	.dismissButton {
		background: transparent;
		border: 1px solid currentColor;
		color: inherit;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.editorLayout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: var(--spacing-xl);
	}

	.mainColumn {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.sideColumn {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.sideCard {
		background: var(--surfaceColor);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.sideCard.danger {
		border: 1px solid oklch(0.8 0.08 20);
	}

	.sideCard h3 {
		color: var(--primaryColor);
		margin: 0 0 var(--spacing-md);
		font-size: 1.1rem;
	}

	.sideCard.danger h3 {
		color: oklch(0.5 0.15 20);
	}

	.formGroup {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.formGroup label {
		font-weight: 600;
		color: var(--textColor);
	}

	.formGroup input,
	.formGroup textarea,
	.formGroup select {
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.titleInput {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.slugInput {
		display: flex;
		align-items: center;
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--backgroundColor);
	}

	.slugPrefix {
		padding: var(--spacing-sm);
		background: var(--surfaceColor);
		color: var(--textMuted);
		font-size: 0.9rem;
		border-right: 1px solid var(--borderColor);
	}

	.slugInput input {
		border: none;
		flex: 1;
	}

	.publishActions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.saveButton,
	.publishButton {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.saveButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.publishButton {
		background: oklch(0.55 0.15 140);
		color: white;
	}

	.saveButton:hover:not(:disabled),
	.publishButton:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.saveButton:disabled,
	.publishButton:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.viewLink {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--borderColor);
	}

	.viewLink a {
		color: var(--primaryColor);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.viewLink a:hover {
		text-decoration: underline;
	}

	.imagePreview {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.imagePreview :global(img) {
		width: 100%;
		border-radius: var(--radius-md);
	}

	.removeImageBtn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.removeImageBtn:hover {
		background: oklch(0.5 0.15 20);
		color: white;
	}

	.changeImageBtn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		color: var(--primaryColor);
		border: 1px solid var(--primaryColor);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.changeImageBtn:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.addImageBtn {
		width: 100%;
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border: 2px dashed var(--borderColor);
		border-radius: var(--radius-md);
		color: var(--textMuted);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.addImageBtn:hover {
		border-color: var(--primaryColor);
		color: var(--primaryColor);
	}

	.deleteButton {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-lg);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.deleteButton:hover:not(:disabled) {
		background: oklch(0.5 0.15 20);
		color: white;
	}

	.deleteButton:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 900px) {
		.editorLayout {
			grid-template-columns: 1fr;
		}

		.sideColumn {
			order: -1;
		}
	}
</style>
